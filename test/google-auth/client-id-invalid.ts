import { expect } from "bun:test";

const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("scope", "openid");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", "foo"); // changed
authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
authUrl.searchParams.set("state", "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4");

const loginResponse = await fetch(authUrl);

const body = await loginResponse.text();
expect(body).toInclude("Access blocked: Authorization Error");
expect(body).toInclude("Error 401: invalid_client");
expect(body).toInclude("The OAuth client was not found.");
expect(loginResponse.status).toEqual(200);

// https://accounts.google.com/signin/oauth/error/v2?authError=xxx&client_id=foo&flowName=GeneralOAuthFlow
