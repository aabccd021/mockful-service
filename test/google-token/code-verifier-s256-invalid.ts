import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";
import * as client from "openid-client";

new sqlite.Database(`${process.env["NETERO_STATE"]}/mock.sqlite`).exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
`);

const config = new client.Configuration(
  {
    issuer: "https://accounts.google.com",
    token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
    authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  },
  "mock_client_id",
  {},
  client.ClientSecretBasic("mock_client_secret"),
);

client.allowInsecureRequests(config);

const pkceCodeVerifier = client.randomPKCECodeVerifier();
const code_challenge = await client.calculatePKCECodeChallenge(pkceCodeVerifier);
const state = client.randomState();

const parameters: Record<string, string> = {
  redirect_uri: "https://localhost:3000/login-callback",
  scope: "openid",
  code_challenge,
  code_challenge_method: "S256",
  state,
};

const authUrl = client.buildAuthorizationUrl(config, parameters);

const loginResponse = await fetch(authUrl, {
  method: "POST",
  redirect: "manual",
  body: new URLSearchParams({
    user_sub: "kita-sub",
  }),
});

const location = new URL(loginResponse.headers.get("Location") ?? "");

const tokenResponse = await client
  .authorizationCodeGrant(config, location, {
    pkceCodeVerifier: "invalid_pkceCodeVerifier",
    expectedState: state,
    idTokenExpected: true,
  })
  .catch((error) => error);

expect(tokenResponse.cause).toEqual({
  error: "invalid_grant",
  error_description: "Invalid code verifier.",
});
expect(tokenResponse.status).toEqual(400);
