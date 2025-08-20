import * as sqlite from "bun:sqlite";
import * as oauth from "openid-client";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
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

const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
const state = oauth.randomState();

const parameters: Record<string, string> = {
  redirect_uri: "https://localhost:3000/login-callback",
  scope: "openid",
  code_challenge,
  code_challenge_method: "S256",
  state,
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

const tokenResponseBody = await tokenResponse.json();
if (tokenResponseBody.error !== "invalid_grant") throw new Error();
if (tokenResponseBody.error_description !== "Missing code verifier.") throw new Error();
if (tokenResponse.status !== 400) throw new Error();
