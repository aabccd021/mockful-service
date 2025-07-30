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
authUrl.searchParams.set("client_id", "mock_client_id");
authUrl.searchParams.set("redirect_uri", "foo"); // changed
authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

const loginResponse = await fetch(authUrl);

// TODO
expect(loginResponse.text()).resolves.toInclude("");
// expect(loginResponse.status).toBe(400);
// https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
//Access blocked: Authorization Error
//
// foo@example.com
//
// You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.
//
// You can let the app developer know that this app doesn't comply with one or more Google validation rules.
// Learn more about this error
// If you are a developer of this app, see error details.
// Error 400: invalid_request
