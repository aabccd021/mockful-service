import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

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

const authUrl = new URL(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
);

const searchParams = new URLSearchParams({
  scope: "openid",
  response_type: "code",
  client_id: "mock_client_id",
  redirect_uri: `http://localhost:3000/login-callback`,
  state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
  prompt: "select_account consent",
});

for (const [key, value] of searchParams) {
  authUrl.searchParams.set(key, value);
}

// goto login screen
const authResponse = await fetch(authUrl, {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

expect(authResponse.status).toBe(200);

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
expect(location.host).toBe("localhost:3000");
expect(location.protocol).toBe("https:");
expect(location.pathname).toBe("/login-callback");
expect(code).not.toBeEmpty();
expect(location.searchParams.get("state")).toBe(
  "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
);
expect(location.searchParams.get("prompt")).toBe("select_account consent");

const authHeader = btoa("mock_client_id:mock_client_secret");

// exchange code for token
const tokenResponse = await fetch(
  "http://localhost:3001/https://oauth2.googleapis.com/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  },
);

const tokenBody = await tokenResponse.json();
expect(tokenBody.scope).toBe("openid");
expect(tokenBody.access_token).toBeDefined();

expect(tokenResponse.status).toBe(200);
