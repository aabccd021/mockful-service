import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as jose from "jose";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_user (project_id, sub, email, email_verified) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com', 'true');
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
      response_type: "code",
      state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
      scope: "openid email",
      client_id: "mock_client_id",
      redirect_uri: `https://localhost:3000/login-callback`,
      user: "kita-sub",
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

const tokenBody = await tokenResponse.json();
const idToken = jose.decodeJwt(tokenBody.id_token);
expect(idToken.sub).toEqual("kita-sub");
expect(idToken["email"]).toEqual("kita@example.com");
expect(idToken["email_verified"]).toEqual(true);
