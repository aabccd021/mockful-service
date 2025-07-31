import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
INSERT INTO paddle_project (id) VALUES ('mock_project_id');
INSERT INTO paddle_api_key (project_id, key) VALUES (
  'mock_project_id', 
  'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
);
`);

const createResponse = await fetch(
  "http://localhost:3001/https://sandbox-api.paddle.com/customers",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  },
);

expect(createResponse.status).toEqual(201);
const createResponseBody = await createResponse.json();
expect(createResponseBody.data.id).toBeDefined();
expect(createResponseBody.data.email).toEqual("nijika@example.com");
