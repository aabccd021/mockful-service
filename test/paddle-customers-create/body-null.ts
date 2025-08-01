import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
INSERT INTO paddle_account (id) VALUES ('mock_account_id');
INSERT INTO paddle_api_key (account_id, key) VALUES (
  'mock_account_id', 
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
    body: JSON.stringify(null),
  },
);

expect(createResponse.status).toEqual(400);
const createResponseBody = await createResponse.json();
expect(createResponseBody.error).toEqual({
  type: "request_error",
  code: "bad_request",
  detail: "Invalid request.",
  documentation_url: "https://developer.paddle.com/v1/errors/shared/bad_request",
  errors: [
    {
      field: "(root)",
      message: "Invalid type. Expected object, received 'object'",
    },
  ],
});
