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
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  },
);

const createResponseBody = await createResponse.json();
const customerId = createResponseBody.data.id;

const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
listUrl.searchParams.set("email", "nijika@example.com");

const response = await fetch(listUrl, {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    "Content-Type": "application/json",
  },
});

expect(response.status).toEqual(200);
const responseBody = await response.json();
const customers = responseBody.data;
expect(customers).toBeArrayOfSize(1);
expect(customers[0]?.email).toEqual("nijika@example.com");
expect(customers[0]?.id).toEqual(customerId);
