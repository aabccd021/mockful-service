import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";
import * as oauth from "openid-client";

using ctx = test.init();

{
  console.info("get base oidc");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
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
}

{
  console.info("get base");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const loginResponseBody = await loginResponse.text();
  if (!loginResponseBody.includes("</form>")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
}

{
  console.info("get client id invalid");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "foo"); // changed
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 401: invalid_client")) throw new Error();
  if (!body.includes("The OAuth client was not found.")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();

  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=foo&flowName=GeneralOAuthFlow
}

{
  console.info("get client id missing");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  // authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes("Missing required parameter: client_id")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&flowName=GeneralOAuthFlow
}

{
  console.info("get code challenge method invalid");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");
  authUrl.searchParams.set("code_challenge_method", "foo"); // changed

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get redirect uri invalid");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
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
  if (!body.includes) throw new Error();
  if (loginResponse.status !== 200) throw new Error();

  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get redirect uri missing");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  // authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes("Missing required parameter: redirect_uri")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get response type invalid");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "foo"); // changed
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes("Invalid response_type: foo")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get response type missing");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  // authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes("Required parameter is missing: response_type")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get scope invalid");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "foo"); // changed
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_scope")) throw new Error();
  if (!body.includes("Some requested scopes were invalid. {invalid=[foo]}")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();

  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get scope missing");

  test.resetDb(ctx);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  // authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

  const loginResponse = await fetch(authUrl);

  const body = await loginResponse.text();
  if (!body.includes("Access blocked: Authorization Error")) throw new Error();
  if (!body.includes("Error 400: invalid_request")) throw new Error();
  if (!body.includes("Missing required parameter: scope")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
  // https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
}

{
  console.info("get state missing");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("scope", "openid");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", "mock_client_id");
  authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
  // authUrl.searchParams.set(
  //   "state",
  //   "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
  // );

  const loginResponse = await fetch(authUrl);

  const loginResponseBody = await loginResponse.text();
  if (!loginResponseBody.includes("</form>")) throw new Error();
  if (loginResponse.status !== 200) throw new Error();
}
