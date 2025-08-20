import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database(`${process.env["NETERO_STATE"]}/mock.sqlite`).exec(`
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

expect(response.status).toEqual(201);
const responseBody = await response.json();
expect(responseBody.data.id).toBeDefined();
expect(responseBody.data.name).toEqual("Mock Product");
expect(responseBody.data.tax_category).toEqual("saas");
expect(responseBody.data.status).toEqual("active");
expect(responseBody.data.description).toEqual(null);
expect(responseBody.data.description).toEqual(null);
expect(responseBody.data.image_url).toEqual(null);
expect(responseBody.data.created_at).toBeDefined();
expect(responseBody.data.updated_at).toBeDefined();
