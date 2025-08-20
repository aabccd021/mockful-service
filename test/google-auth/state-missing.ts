import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database("./mock.sqlite").exec(`
  INSERT INTO google_project (id) VALUES ('mock_project_id');
  INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
`);

const authUrl = new URL("http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("scope", "openid");
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("client_id", "mock_client_id");
authUrl.searchParams.set("redirect_uri", "https://localhost:3000/login-callback");
// authUrl.searchParams.set(
//   "state",
//   "sfZavFFyK5PDKdkEtHoOZ5GdXZtY1SwCTsHzlh6gHm4",
// );

const loginResponse = await fetch(authUrl);

expect(loginResponse.text()).resolves.toInclude("</form>");
expect(loginResponse.status).toEqual(200);
