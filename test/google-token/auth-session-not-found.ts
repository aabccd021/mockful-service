import { expect } from "bun:test";

const tokenResponse = await fetch(
  "http://localhost:3001/https://oauth2.googleapis.com/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "foo",
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  },
);

expect(tokenResponse.status).toEqual(400);

expect(tokenResponse.json()).resolves.toEqual({
  error: "invalid_grant",
  error_description: "Malformed auth code.",
});
