import type * as sqlite from "bun:sqlite";
import { SQLiteError } from "bun:sqlite";
import type { components } from "@openapi/paddle.ts";
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

type AuthenticatedRequest = {
  id: string;
  accountId: string;
};

export function authenticate(req: Request): ResponseOr<AuthenticatedRequest> {
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
    .query<{ account_id: string }, sqlite.SQLQueryBindings>(
      "SELECT account_id FROM paddle_api_key WHERE key = $key",
    )
    .get({ key: reqApiKey });

  if (apiKey === null) {
    return [forbiddenResponse()];
  }

  return [
    undefined,
    {
      accountId: apiKey.account_id,
      id: crypto.randomUUID(),
    },
  ];
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.getRandomValues(new Uint8Array(26));
  return Array.from(randomBytes)
    .map((b) => chars.charAt(b % chars.length))
    .join("");
}

export type ErrorBody = components["schemas"]["error"];

export type FieldError = {
  field: string;
  message: string;
};

export type FieldValidation<T> = [FieldError[]] | [undefined, T];

export function invalidRequest(
  authReq: AuthenticatedRequest,
  errors: ErrorBody["error"]["errors"],
): Response {
  const resBody: ErrorBody = {
    error: {
      type: "request_error",
      code: "bad_request",
      detail: "Invalid request.",
      documentation_url: "https://developer.paddle.com/v1/errors/shared/bad_request",
      errors: errors ?? [],
    },
    meta: {
      request_id: authReq.id,
    },
  };
  return Response.json(resBody, { status: 400 });
}

export async function getBody(authReq: AuthenticatedRequest, req: Request) {
  let rawBody = null;
  try {
    rawBody = await req.json();
  } catch (_) {
    const resBody: ErrorBody = {
      error: {
        type: "request_error",
        code: "bad_request",
        detail: "invalid JSON",
        documentation_url: "https://developer.paddle.com/v1/errors/shared/bad_request",
      },
      meta: {
        request_id: authReq.id,
      },
    };
    return [Response.json(resBody, { status: 400 })] as const;
  }

  if (rawBody === null || typeof rawBody !== "object") {
    const rawBodyType = rawBody === null ? "null" : typeof rawBody;
    return [
      invalidRequest(authReq, [
        {
          field: "(root)",
          message: `Invalid type. Expected: object, given: ${rawBodyType}`,
        },
      ]),
    ];
  }

  return [undefined, rawBody] as const;
}

export function mapSqliteError(
  authReq: AuthenticatedRequest,
  err: unknown,
  map: Record<string, FieldError>,
): Response | undefined {
  if (!(err instanceof SQLiteError)) {
    return undefined;
  }

  const fieldError = map[err.message];
  if (fieldError === undefined) {
    return undefined;
  }

  return invalidRequest(authReq, [fieldError]);
}
