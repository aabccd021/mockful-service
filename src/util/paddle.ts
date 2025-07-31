import type { ResponseOr } from "@util/index.ts";
import { db } from "@util/index.ts";

import { assert, nullable, object, string } from "superstruct";

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
    return {
      type: "response",
      response: forbiddenResponse(),
    };
  }

  const [prefix, apiKey] = authHeader.split(" ");
  if (prefix !== "Bearer") {
    return {
      type: "response",
      response: forbiddenResponse(),
    };
  }

  if (apiKey === undefined) {
    return {
      type: "response",
      response: authenticationMalformedResponse(),
    };
  }

  const apiKeyRow = db
    .query("SELECT account_id FROM paddle_api_key WHERE key = $key")
    .get({ key: apiKey });

  assert(apiKeyRow, nullable(object({ account_id: string() })));

  if (apiKeyRow === null) {
    return {
      type: "response",
      response: forbiddenResponse(),
    };
  }

  return {
    type: "value",
    value: apiKeyRow.account_id,
  };
}

export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const randomBytes = crypto.getRandomValues(new Uint8Array(26));
  return Array.from(randomBytes)
    .map((b) => chars.charAt(b % chars.length))
    .join("");
}
