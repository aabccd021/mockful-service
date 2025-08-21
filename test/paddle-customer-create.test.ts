import * as sqlite from "bun:sqlite";
import * as util from "./util.ts";

{
  console.info("customer already exists.ts");

  const ctx = util.init();

  new sqlite.Database(ctx.dbPath).exec(`
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

  const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  });

  if (response.status !== 409) throw new Error();
  const responseBody = await response.json();
  if (responseBody.error.type !== "request_error") throw new Error();
  if (responseBody.error.code !== "customer_already_exists") throw new Error();
  if (!responseBody.error.detail.startsWith("customer email conflicts with customer of id ctm_"))
    throw new Error();
  if (
    responseBody.error.documentation_url !==
    "https://developer.paddle.com/v1/errors/customers/customer_already_exists"
  )
    throw new Error();

  util.deinit(ctx);
}

{
  console.info("success.ts");

  const ctx = util.init();

  new sqlite.Database(ctx.dbPath).exec(`
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
  if (responseBody.data.id === undefined) throw new Error();
  if (responseBody.data.email !== "nijika@example.com") throw new Error();

  util.deinit(ctx);
}
