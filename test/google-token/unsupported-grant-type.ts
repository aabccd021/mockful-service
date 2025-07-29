import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  body: new URLSearchParams({
    grant_type: "foo",
  }),
});

expect(tokenResponse.json()).resolves.toEqual({
  error: "unsupported_grant_type",
  error_description: "Invalid grant_type: foo",
});
expect(tokenResponse.status).toEqual(400);
