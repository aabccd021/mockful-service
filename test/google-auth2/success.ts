import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

const db = new sqlite.Database(`${neteroState}/mock.sqlite`, {
  strict: true,
  safeIntegers: true,
});

db.query(
  `
INSERT INTO google_auth_user (sub, email)
  VALUES ('kita-sub', 'kita@example.com');

INSERT INTO google_auth_client (id, secret)
  VALUES ('mock_client_id', 'mock_client_secret');
`,
).run();

const authUrl = new URL(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
);

const searchParams = new URLSearchParams({
  response_type: "code",
  client_id: "mock_client_id",
  redirect_uri: `http://localhost:3000/login-callback`,
  state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
  prompt: "select_account consent",
});

for (const [key, value] of searchParams) {
  authUrl.searchParams.set(key, value);
}

const authResult = await fetch(authUrl, {
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

expect(authResult.status).toBe(200);

const loginResult = await fetch(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      user: "kita-sub",
      response_type: "code",
      client_id: "mock_client_id",
      redirect_uri: `https://localhost:3000/login-callback`,
      state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
      prompt: "select_account consent",
    }),
  },
);

expect(loginResult.status).toBe(303);

const location = new URL(loginResult.headers.get("Location") ?? "");
expect(location.host).toBe("localhost:3000");
expect(location.protocol).toBe("https:");
expect(location.pathname).toBe("/login-callback");
expect(location.searchParams.get("code")).toBeDefined();
expect(location.searchParams.get("state")).toBe(
  "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
);
expect(location.searchParams.get("prompt")).toBe("select_account consent");
