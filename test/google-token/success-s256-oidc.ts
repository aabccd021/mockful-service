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

const state = client.randomState();
const code_verifier = client.randomPKCECodeVerifier();
const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

const loginResponse = await fetch(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      scope: "openid",
      user_sub: "kita-sub",
      response_type: "code",
      client_id: "mock_client_id",
      redirect_uri: `https://localhost:3000/login-callback`,
      state,
      code_challenge,
      code_challenge_method: "S256",
    }),
  },
);

const location = new URL(loginResponse.headers.get("Location") ?? "");

const tokens = await client.authorizationCodeGrant(config, location, {
  pkceCodeVerifier: code_verifier,
  expectedState: state,
  idTokenExpected: true,
});
expect(tokens.claims()?.sub).toEqual("kita-sub");
