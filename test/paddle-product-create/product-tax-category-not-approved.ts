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

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Mock Product",
    tax_category: "saas",
  }),
});

expect(response.status).toEqual(400);
const responseBody = await response.json();
expect(responseBody.error).toEqual({
  type: "request_error",
  code: "product_tax_category_not_approved",
  detail: "tax category not approved",
  documentation_url:
    "https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved",
});
