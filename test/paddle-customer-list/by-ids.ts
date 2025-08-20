import * as sqlite from "bun:sqlite";
import { expect } from "bun:test";

new sqlite.Database("./mock.sqlite").exec(`
INSERT INTO paddle_account (id) VALUES ('mock_account_id');
INSERT INTO paddle_api_key (account_id, key) VALUES (
  'mock_account_id', 
  'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
);
`);

await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    email: "nijika@example.com",
  }),
});

const kitaRes = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    email: "kita@example.com",
  }),
});
const kitaId = (await kitaRes.json()).data.id;

const yamadaRes = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
  method: "POST",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
  body: JSON.stringify({
    email: "yamada@example.com",
  }),
});
const yamadaId = (await yamadaRes.json()).data.id;

const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
listUrl.searchParams.set("id", `${kitaId},${yamadaId}`);

const response = await fetch(listUrl, {
  method: "GET",
  headers: {
    Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
  },
});

if (response.status !== 200) throw new Error();
const responseBody = await response.json();
const customers = responseBody.data;
expect(customers).toBeArrayOfSize(2);
if (customers[0]?.email !== "kita@example.com") throw new Error();
if (customers[0]?.id !== kitaId) throw new Error();
if (customers[1]?.email !== "yamada@example.com") throw new Error();
if (customers[1]?.id !== yamadaId) throw new Error();
