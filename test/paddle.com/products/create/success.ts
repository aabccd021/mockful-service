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
//       name: "Mock Product",
//       tax_category: "saas"
//     }),
//   },
// );
//
// expect(createResponse.status).toEqual(201);
// const createResponseBody = await createResponse.json();
// expect(createResponseBody.data.id).toBeDefined();
// expect(createResponseBody.data.name).toEqual("Mock Product");
// expect(createResponseBody.data.tax_category).toEqual("saas");
// expect(createResponseBody.data.status).toEqual("active");
// expect(createResponseBody.data.description).toEqual(null);
// expect(createResponseBody.data.description).toEqual(null);
// expect(createResponseBody.data.image_url).toEqual(null);
// expect(createResponseBody.data.custom_data).toEqual(null);
// expect(createResponseBody.data.created_at).toBeDefined();
// expect(createResponseBody.data.updated_at).toBeDefined();
