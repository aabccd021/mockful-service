import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database("./mock.sqlite").exec(`
INSERT INTO paddle_account (id) VALUES ('mock_account_id');
INSERT INTO paddle_api_key (account_id, key) VALUES (
  'mock_account_id', 
  'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
);
`);

const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    email: "nijika@example.com",
  }),
});

if (response.status !== 201) throw new Error();
const responseBody = await response.json();
expect(responseBody.data.id).toBeDefined();
if (responseBody.data.email !== "nijika@example.com") throw new Error();
