import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as jose from "jose";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
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
      prompt: "select_account consent",
    }),
  },
);
expect(loginResponse.status).toEqual(303);

const location = new URL(loginResponse.headers.get("Location") ?? "");
const code = location.searchParams.get("code") ?? "";
expect(location.origin).toEqual("https://localhost:3000");
expect(location.pathname).toEqual("/login-callback");
expect(code).not.toEqual("");
expect(location.searchParams.get("state")).toEqual("sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");
expect(location.searchParams.get("prompt")).toEqual("select_account consent");

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

expect(tokenResponse.status).toEqual(200);

const tokenBody = await tokenResponse.json();

expect(tokenBody.scope).toEqual("openid");
expect(tokenBody.token_type).toEqual("Bearer");
expect(tokenBody.expires_in).toEqual(3599);
expect(tokenBody.access_token).toBeTypeOf("string");

const idToken = jose.decodeJwt(tokenBody.id_token);
expect(idToken.sub).toEqual("kita-sub");
expect(idToken.aud).toEqual("mock_client_id");
expect(idToken).not.toContainKey("email");
expect(idToken).not.toContainKey("email_verified");
