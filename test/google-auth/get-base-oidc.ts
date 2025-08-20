import * as sqlite from "bun:sqlite";
import * as client from "openid-client";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
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

const loginResponse = await fetch(authUrl);

const loginResponseBody = await loginResponse.text();
if (!loginResponseBody.includes("</form>")) throw new Error();
if (loginResponse.status !== 200) throw new Error();
