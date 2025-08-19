import type * as sqlite from "bun:sqlite";
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
    { status: 403 },
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
    { status: 400 },
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
