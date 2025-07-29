import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email, email_verified) VALUES ('nijika-sub', 'nijika@example.com', 'true');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

// submit login screen
const loginResponse = await fetch(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      response_type: "code",
      scope: "openid",
      state: "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
      redirect_uri: `https://localhost:3000/login-callback`,
      user: "nijika-sub",
    }),
  },
);

expect(loginResponse.status).toEqual(400);
expect(await loginResponse.text()).toEqual("Failed to store login session.");
