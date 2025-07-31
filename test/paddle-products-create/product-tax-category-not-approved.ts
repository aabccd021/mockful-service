// import * as sqlite from "bun:sqlite";
// import { expect } from "bun:test";
//
// const neteroState = process.env["NETERO_STATE"];
//
// new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true }).exec(`
// INSERT INTO paddle_account (id, tax_category_saas_enabled) VALUES ('mock_account_id', 'true');
// INSERT INTO paddle_api_key (account_id, key) VALUES (
//   'mock_account_id',
//   'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
// );
// `);
//
// const createResponse = await fetch(
//   "http://localhost:3001/https://sandbox-api.paddle.com/products",
//   {
//     method: "POST",
//     headers: {
//       Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       name: "Mock Product"
//     }),
//   },
// );
//
// expect(createResponse.status).toEqual(400);
// const createResponseBody = await createResponse.json();
// expect(createResponseBody.data.error.type).toEqual("request_error");
// expect(createResponseBody.data.error.code).toEqual("product_tax_category_not_approved");
// expect(createResponseBody.data.error.message).toEqual( "tax category not approved");
// expect(createResponseBody.data.error.documentation_url).toEqual("https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved");
