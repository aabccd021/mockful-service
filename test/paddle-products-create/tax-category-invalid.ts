import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

const neteroState = process.env["NETERO_STATE"];

new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
INSERT INTO paddle_account (id, tax_category_saas_enabled) VALUES ('mock_account_id', 'true');
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
    tax_category: "foo",
  }),
});

expect(response.status).toEqual(400);
const responseBody = await response.json();
expect(responseBody.error.type).toEqual("request_error");
expect(responseBody.error.code).toEqual("bad_request");
expect(responseBody.error.detail).toEqual("Invalid request.");
expect(responseBody.error.documentation_url).toEqual(
  "https://developer.paddle.com/v1/errors/shared/bad_request",
);
expect(responseBody.error.errors).toContainAllValues([
  {
    field: "tax_category",
    message:
      'must be one of the following: "digital-goods", "ebooks", "implementation-services", "professional-services", "saas", "software-programming-services", "standard", "training-services", "website-hosting"',
  },
]);
