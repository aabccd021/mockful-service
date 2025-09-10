import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("not found");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const transactionGet = await fetch(
    `http://localhost:3001/https://sandbox-api.paddle.com/transactions/txn_01k12pjaxbk75f51t00tar1fz8`,
    {
      method: "GET",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
    },
  );
  if (transactionGet.status !== 404) throw new Error();
}
