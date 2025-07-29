import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
  },
  body: new URLSearchParams({
    grant_type: "foo",
  }),
});

expect(tokenResponse.json()).resolves.toEqual({
  error: "unsupported_grant_type",
  error_description: "Invalid grant_type: foo",
});
expect(tokenResponse.status).toEqual(400);
