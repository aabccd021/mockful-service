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

expect(tokenResponse.json()).resolves.toEqual({
  error: "invalid_request",
  error_description: "Missing parameter: redirect_uri",
});
expect(tokenResponse.status).toEqual(400);
