import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${btoa(":mock_client_secret")}`,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: "https://localhost:3000/login-callback",
  }),
});

expect(tokenResponse.json()).resolves.toEqual({
  error: "invalid_request",
  error_description: "Could not determine client ID from request.",
});
expect(tokenResponse.status).toEqual(400);
