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
if (tokenResponseBody.error !== "unsupported_grant_type") throw new Error();
if (tokenResponseBody.error_description !== "Invalid grant_type: foo") throw new Error();
if (tokenResponse.status !== 400) throw new Error();
