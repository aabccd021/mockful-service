import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic `,
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: "https://localhost:3000/login-callback",
  }),
});

expect(tokenResponse.json()).resolves.toEqual({
  error: "invalid_request",
  error_description: "Bad Request",
});
expect(tokenResponse.status).toEqual(400);
