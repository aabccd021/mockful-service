import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as client from "openid-client";

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
      user_sub: "kita-sub",
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

const config = new client.Configuration(
  {
    issuer: "https://accounts.google.com",
    token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
  },
  "mock_client_id",
  {},
  client.ClientSecretBasic("mock_client_secret"),
);

client.allowInsecureRequests(config);

const tokens = await client.authorizationCodeGrant(config, location, {
  pkceCodeVerifier: "AWnuB2qLobencpDhxdlDb_yeTixrfG9SiKYOjwYrz4I",
  expectedState: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
  idTokenExpected: true,
});
const claims = tokens.claims();
expect(claims?.sub).toEqual("kita-sub");
