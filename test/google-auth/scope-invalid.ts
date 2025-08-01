import { expect } from "bun:test";

const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("scope", "foo"); // changed
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", "mock_client_id");
authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

const loginResponse = await fetch(authUrl);

const body = await loginResponse.text();
expect(body).toInclude("Access blocked: Authorization Error");
expect(body).toInclude("Error 400: invalid_scope");
expect(loginResponse.status).toEqual(200);

// https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=xxx.apps.googleusercontent.com&flowName=GeneralOAuthFlow
// Access blocked: Authorization Error
//
// foo@example.com
// Some requested scopes were invalid. {invalid=[foo]} Learn more about this error
// If you are a developer of project_id, see error details.
// Error 400: invalid_scope
