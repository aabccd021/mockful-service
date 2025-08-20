import { expect } from "bun:test";

const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "foo",
  }),
});

const tokenResponseBody = await tokenResponse.json();
expect(tokenResponseBody.error).toEqual("unsupported_grant_type");
expect(tokenResponseBody.error_description).toEqual("Invalid grant_type: foo");
expect(tokenResponse.status).toEqual(400);
