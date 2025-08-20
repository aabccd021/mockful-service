import * as sqlite from "bun:sqlite";
import * as oauth from "openid-client";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
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

const loginResponse = await fetch(authUrl);

const loginResponseBody = await loginResponse.text();
if (!loginResponseBody.includes("</form>")) throw new Error();
if (loginResponse.status !== 200) throw new Error();
