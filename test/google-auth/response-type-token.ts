import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email) VALUES ('kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

const authUrl = new URL(
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
);

authUrl.searchParams.set("response_type", "token");

const loginResponse = await fetch(authUrl);

expect(loginResponse.status).toEqual(400);
expect(await loginResponse.text()).toContain(
  'Invalid response_type: "token". Expected "code".',
);
