import { expect } from "bun:test";

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
expect(tokenResponseBody.error).toEqual("invalid_request");
expect(tokenResponseBody.error_description).toEqual("Missing parameter: redirect_uri");
expect(tokenResponse.status).toEqual(400);
