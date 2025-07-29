import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email) VALUES ('kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

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
      code_challenge: "G5k-xbS5eqMAekQELZ07AhN64LQxBuB4wVG7wryu5b8",
      code_challenge_method: "S256",
    }),
  },
);

const location = new URL(loginResponse.headers.get("Location") ?? "");
const code = location.searchParams.get("code") ?? "";
const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
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
});

expect(tokenResponse.json()).resolves.toEqual({
  error: "invalid_grant",
  error_description: "Missing code verifier.",
});
expect(tokenResponse.status).toEqual(400);
