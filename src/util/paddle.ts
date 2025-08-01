import type * as openapi from "@openapi/paddle.ts";
import type { ResponseOr } from "@util/index.ts";
import { db } from "@util/index.ts";

function forbiddenResponse(): Response {
  return Response.json(
    {
      error: {
        type: "request_error",
        code: "forbidden",
        detail: "You aren't permitted to perform this request.",
        documentation_url: "https://developer.paddle.com/v1/errors/shared/forbidden",
      },
    },
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function authenticationMalformedResponse(): Response {
  return Response.json(
    {
      error: {
        type: "request_error",
        code: "authentication_malformed",
        detail: "Authentication header included, but incorrectly formatted.",
        documentation_url: "https://developer.paddle.com/v1/errors/shared/authentication_malformed",
      },
    },
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function getAccountId(req: Request): ResponseOr<string> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    return [forbiddenResponse()];
  }

  const [prefix, reqApiKey] = authHeader.split(" ");
  if (prefix !== "Bearer") {
    return [forbiddenResponse()];
  }

  if (reqApiKey === undefined) {
    return [authenticationMalformedResponse()];
  }

  const apiKey = db
    .query<{ account_id: string }, { key: string }>(
      "SELECT account_id FROM paddle_api_key WHERE key = $key",
    )
    .get({ key: reqApiKey });

  if (apiKey === null) {
    return [forbiddenResponse()];
  }

  return [undefined, apiKey.account_id];
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.getRandomValues(new Uint8Array(26));
  return Array.from(randomBytes)
    .map((b) => chars.charAt(b % chars.length))
    .join("");
}

export type DefaultError = openapi.components["schemas"]["error"];

export type FieldError = {
  field: string;
  message: string;
};

export type FieldValidation<T> = [FieldError] | [undefined, T];

export function invalidRequest(
  requestId: string,
  errors: DefaultError["error"]["errors"],
): Response {
  const resBody: DefaultError = {
    error: {
      type: "request_error",
      code: "bad_request",
      detail: "Invalid request.",
      documentation_url: "https://developer.paddle.com/v1/errors/shared/bad_request",
      errors: errors,
    },
    meta: {
      request_id: requestId,
    },
  };
  return Response.json(resBody, { status: 400 });
}

export async function getBody(requestId: string, req: Request): Promise<ResponseOr<object>> {
  let rawBody = null;
  try {
    rawBody = await req.json();
  } catch (_) {
    const resBody: DefaultError = {
      error: {
        type: "request_error",
        code: "bad_request",
        detail: "invalid JSON",
        documentation_url: "https://developer.paddle.com/v1/errors/shared/bad_request",
      },
      meta: {
        request_id: requestId,
      },
    };
    return [Response.json(resBody, { status: 400 })];
  }

  if (rawBody === null || typeof rawBody !== "object") {
    return [invalidRequest(requestId, [invalidType(rawBody, "(root)", "object")])];
  }

  return [undefined, rawBody];
}

export function invalidType<T, K extends keyof T>(
  obj: T,
  field: K & string,
  expectedType: string,
): FieldError {
  const target = field === "(root)" ? obj : obj[field];
  const targetType = Number.isInteger(target) ? "integer" : typeof target;
  return {
    field,
    message: `Invalid type. Expected: ${expectedType}, given: ${targetType}`,
  };
}

export function requiredField(field: string, requiredField: string): FieldError {
  return {
    field,
    message: `${requiredField} is required`,
  };
}
