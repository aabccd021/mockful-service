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
