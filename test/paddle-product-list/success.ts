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

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Product 1",
    tax_category: "saas",
  }),
});

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Product 2",
    tax_category: "saas",
  }),
});

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Product 3",
    tax_category: "saas",
  }),
});

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
});

if (response.status !== 200) throw new Error();
const responseBody = await response.json();
const products = responseBody.data;
expect(products).toBeArrayOfSize(3);
if (products[0]?.name !== "Product 1") throw new Error();
if (products[1]?.name !== "Product 2") throw new Error();
if (products[2]?.name !== "Product 3") throw new Error();
