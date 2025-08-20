import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database("./mock.sqlite").exec(`
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
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  },
);

const createResponseBody = await createResponse.json();
const customerId = createResponseBody.data.id;

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
});

if (response.status !== 200) throw new Error();
const responseBody = await response.json();
const customers = responseBody.data;
expect(customers).toBeArrayOfSize(1);
if (customers[0]?.email !== "nijika@example.com") throw new Error();
if (customers[0]?.id !== customerId) throw new Error();
if (customers[0]?.status !== "active") throw new Error();
if (customers[0]?.marketing_consent !== false) throw new Error();
if (customers[0]?.locale !== "en") throw new Error();
