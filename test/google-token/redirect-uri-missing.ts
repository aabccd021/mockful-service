const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
  }),
});

const tokenResponseBody = await tokenResponse.json();
if (tokenResponseBody.error !== "invalid_request") throw new Error();
if (tokenResponseBody.error_description !== "Missing parameter: redirect_uri") throw new Error();
if (tokenResponse.status !== 400) throw new Error();
