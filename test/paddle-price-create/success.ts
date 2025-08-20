import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database("./mock.sqlite").exec(`
INSERT INTO paddle_account (id) VALUES ('mock_account_id');
INSERT INTO paddle_api_key (account_id, key) VALUES (
  'mock_account_id',
  'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
);
INSERT INTO paddle_account_tax_category_enabled (account_id, tax_category) 
  VALUES ('mock_account_id', 'saas');
`);

const productResponse = await fetch(
  "http://localhost:3001/https://sandbox-api.paddle.com/products",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      name: "My SaaS",
      tax_category: "saas",
    }),
  },
);

const productId = (await productResponse.json()).data.id;

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    product_id: productId,
    description: "One-time purchase of my saas",
    unit_price: {
      amount: "500",
      currency_code: "USD",
    },
  }),
});

if (response.status !== 201) throw new Error();
const responseBody = await response.json();
expect(responseBody.data.id).toStartWith("pri_");
if (responseBody.data.product_id !== productId) throw new Error();
if (responseBody.data.description !== "One-time purchase of my saas") throw new Error();
if (responseBody.data.unit_price.amount !== "500") throw new Error();
if (responseBody.data.unit_price.currency_code !== "USD") throw new Error();
