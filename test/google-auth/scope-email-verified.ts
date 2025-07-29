import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as jose from "jose";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email, email_verified) VALUES ('yamada-sub', 'yamada@example.com', 'false');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

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
      response_type: "code",
      state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
      scope: "openid email",
      client_id: "mock_client_id",
      redirect_uri: `https://localhost:3000/login-callback`,
      user: "yamada-sub",
    }),
  },
);

const location = new URL(loginResponse.headers.get("Location") ?? "");
const code = location.searchParams.get("code") ?? "";

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

const tokenBody = await tokenResponse.json();
const idToken = jose.decodeJwt(tokenBody.id_token);
expect(idToken.sub).toEqual("yamada-sub");
expect(idToken["email"]).toEqual("yamada@example.com");
expect(idToken["email_verified"]).toEqual(false);
