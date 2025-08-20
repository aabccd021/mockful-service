import * as sqlite from "bun:sqlite";
import * as oauth from "openid-client";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
`);

const config = new oauth.Configuration(
  {
    issuer: "https://accounts.google.com",
    token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
    authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  },
  "mock_client_id",
  {},
  oauth.ClientSecretBasic("mock_client_secret"),
);

oauth.allowInsecureRequests(config);

const state = oauth.randomState();

const parameters: Record<string, string> = {
  redirect_uri: "https://localhost:3000/login-callback",
  scope: "openid",
  state,
  prompt: "select_account consent",
};

const authUrl = oauth.buildAuthorizationUrl(config, parameters);

const loginResponse = await fetch(authUrl, {
  method: "POST",
  redirect: "manual",
  body: new URLSearchParams({
    user_sub: "kita-sub",
  }),
});

const location = new URL(loginResponse.headers.get("Location") ?? "");

const tokenResponse = await oauth
  .authorizationCodeGrant(config, location, {
    expectedState: state,
    idTokenExpected: true,
  })
  .catch((error) => error);
if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
