const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Advanced ${btoa("mock_client_id:mock_client_secret")}`,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: "https://localhost:3000/login-callback",
  }),
});

const tokenResponseBody = await tokenResponse.json();
if (tokenResponseBody.error !== "invalid_request") throw new Error();
if (tokenResponseBody.error_description !== "Could not determine client ID from request.")
  throw new Error();
if (tokenResponse.status !== 400) throw new Error();
