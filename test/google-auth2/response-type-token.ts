import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
  INSERT INTO google_auth_user (sub, email) VALUES ('kita-sub', 'kita@example.com');
  INSERT INTO google_auth_client (id, secret) VALUES ('mock_client_id', 'mock_client_secret');
`);

const authUrl =
  "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth";

const loginResponse = await fetch(authUrl);

expect(loginResponse.status).toEqual(400);
