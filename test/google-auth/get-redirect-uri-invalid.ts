import * as sqlite from "bun:sqlite";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
`);

const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("scope", "openid");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", "mock_client_id");
authUrl.searchParams.set("redirect_uri", "foo"); // changed
authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

const loginResponse = await fetch(authUrl);

const body = await loginResponse.text();
if (!body.includes("Access blocked: Authorization Error")) throw new Error();
if (!body.includes("Error 400: invalid_request")) throw new Error();
if (!body.includes)
  throw new Error()(
    "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.",
  );
if (!body.includes)
  throw new Error()(
    "You can let the app developer know that this app doesn't comply with one or more Google validation rules.",
  );
if (loginResponse.status !== 200) throw new Error();

// https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
