import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email) VALUES ('kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("scope", "openid");
authUrl.searchParams.set("user", "kita-sub");
authUrl.searchParams.set("response_type", "code");
// authUrl.searchParams.set("client_id", "mock_client_id");
authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

const loginResponse = await fetch(authUrl);

const body = await loginResponse.text();
expect(body).toInclude("Access blocked: Authorization Error");
expect(body).toInclude("Error 400: invalid_request");
expect(loginResponse.status).toEqual(200);
// expect(loginResponse.status).toEqual(400);
// https://accounts.google.com/signin/oauth/error/v2?authError=xxx&flowName=GeneralOAuthFlow
// Access blocked: Authorization Error
//
// foo@example.com
// Missing required parameter: client_id Learn more about this error
// If you are a developer of this app, see error details.
// Error 400: invalid_request
