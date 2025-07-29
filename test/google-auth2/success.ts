import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as jose from "jose";
import { assert, number, string, type } from "superstruct";

const neteroState = process.env["NETERO_STATE"];

const db = new sqlite.Database(`${neteroState}/mock.sqlite`, {
  strict: true,
  safeIntegers: true,
});

db.exec(
  `
INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');
`,
);

// submit login screen
const loginResponse = await fetch(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      scope: "openid",
      user: "kita-sub",
      response_type: "code",
      client_id: "mock_client_id",
      redirect_uri: `https://localhost:3000/login-callback`,
      state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
      prompt: "select_account consent",
    }),
  },
);

expect(loginResponse.status).toBe(303);

const location = new URL(loginResponse.headers.get("Location") ?? "");
const code = location.searchParams.get("code") ?? "";
expect(location.origin).toBe("https://localhost:3000");
expect(location.pathname).toBe("/login-callback");
expect(code).not.toBeEmpty();
expect(location.searchParams.get("state")).toBe(
  "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
);
expect(location.searchParams.get("prompt")).toBe("select_account consent");

// exchange code for token
const tokenResponse = await fetch(
  "http://localhost:3001/https://oauth2.googleapis.com/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  },
);

expect(tokenResponse.status).toBe(200);

const tokenBody = await tokenResponse.json();

assert(
  tokenBody,
  type({
    id_token: string(),
    access_token: string(),
    scope: string(),
    token_type: string(),
    expires_in: number(),
  }),
);

expect(tokenBody.scope).toEqual("openid");
expect(tokenBody.token_type).toEqual("Bearer");
expect(tokenBody.expires_in).toEqual(3599);

const idToken = jose.decodeJwt(tokenBody.id_token);
expect(idToken.sub).toBe("kita-sub");
