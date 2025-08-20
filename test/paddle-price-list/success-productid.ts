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

const product1Res = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "prod1",
    tax_category: "saas",
  }),
});

const product1Id = (await product1Res.json()).data.id;

const product2Res = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "prod1",
    tax_category: "saas",
  }),
});

const product2Id = (await product2Res.json()).data.id;

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    product_id: product1Id,
    description: "product1-recurring",
    unit_price: {
      amount: "100",
      currency_code: "USD",
    },
    billing_cycle: {
      frequency: 1,
      interval: "year",
    },
  }),
});

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    product_id: product1Id,
    description: "product1-onetime",
    unit_price: {
      amount: "100",
      currency_code: "USD",
    },
  }),
});

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    product_id: product2Id,
    description: "product2-recurring",
    unit_price: {
      amount: "100",
      currency_code: "USD",
    },
    billing_cycle: {
      frequency: 1,
      interval: "year",
    },
  }),
});

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    product_id: product2Id,
    description: "product2-onetime",
    unit_price: {
      amount: "100",
      currency_code: "USD",
    },
  }),
});

const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/prices");
listUrl.searchParams.set("product_id", product2Id);

const listProduct2Recurring = await fetch(listUrl, {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
});

if (listProduct2Recurring.status !== 200) throw new Error();
const listProduct2RecurringBody = await listProduct2Recurring.json();
expect(listProduct2RecurringBody.data).toBeArrayOfSize(2);
if (listProduct2RecurringBody.data[0].description !== "product2-recurring") throw new Error();
if (listProduct2RecurringBody.data[1].description !== "product2-onetime") throw new Error();
