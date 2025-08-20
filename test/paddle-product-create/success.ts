import * as sqlite from "bun:sqlite";

new sqlite.Database("./mock.sqlite").exec(`
INSERT INTO paddle_account (id) VALUES ('mock_account_id');
INSERT INTO paddle_api_key (account_id, key) VALUES (
  'mock_account_id',
  'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
);
INSERT INTO paddle_account_tax_category_enabled (account_id, tax_category) 
  VALUES ('mock_account_id', 'saas');
`);

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    name: "Mock Product",
    tax_category: "saas",
  }),
});

if (response.status !== 201) throw new Error();
const responseBody = await response.json();
if (responseBody.data.id === undefined) throw new Error();
if (responseBody.data.name !== "Mock Product") throw new Error();
if (responseBody.data.tax_category !== "saas") throw new Error();
if (responseBody.data.status !== "active") throw new Error();
if (responseBody.data.image_url !== null) throw new Error();
if (responseBody.data.created_at === undefined) throw new Error();
if (responseBody.data.updated_at === undefined) throw new Error();
