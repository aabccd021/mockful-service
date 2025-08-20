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

expect(response.status).toEqual(200);
const responseBody = await response.json();
const customers = responseBody.data;
expect(customers).toBeArrayOfSize(1);
expect(customers[0]?.email).toEqual("nijika@example.com");
expect(customers[0]?.id).toEqual(customerId);
expect(customers[0]?.status).toEqual("active");
expect(customers[0]?.marketing_consent).toEqual(false);
expect(customers[0]?.name).toEqual(null);
expect(customers[0]?.locale).toEqual("en");
