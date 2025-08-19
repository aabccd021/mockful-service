import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
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

const product2Res = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Product 2",
    tax_category: "saas",
  }),
});
const product2Id = (await product2Res.json()).data.id;

const product3Res = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Product 3",
    tax_category: "saas",
  }),
});
const product3Id = (await product3Res.json()).data.id;

const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/products");
listUrl.searchParams.set("id", `${product2Id},${product3Id}`);

const response = await fetch(listUrl, {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
});

expect(response.status).toEqual(200);
const responseBody = await response.json();
const products = responseBody.data;
expect(products).toBeArrayOfSize(2);
expect(products[0]?.id).toEqual(product2Id);
expect(products[0]?.name).toEqual("Product 2");
expect(products[1]?.id).toEqual(product3Id);
expect(products[1]?.name).toEqual("Product 3");
