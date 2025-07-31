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

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "nijika@example.com",
  }),
});

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "nijika@example.com",
  }),
});

expect(response.status).toEqual(409);
const responseBody = await response.json();
expect(responseBody.error.type).toEqual("request_error");
expect(responseBody.error.code).toEqual("customer_already_exists");
expect(responseBody.error.detail).toStartWith("customer email conflicts with customer of id ctm_");
expect(responseBody.error.documentation_url).toEqual(
  "https://developer.paddle.com/v1/errors/customers/customer_already_exists",
);
