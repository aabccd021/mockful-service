import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("success");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
    INSERT INTO paddle_account_tax_category_enabled (account_id, tax_category) 
      VALUES ('mock_account_id', 'saas');
    INSERT INTO config_integer (name, value) VALUES ('now_epoch_millis', '${new Date("2024-01-01T00:00:00Z").getTime()}');
  `);

  const customer = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  }).then((res) => res.json());
  const customerId = customer.data.id;

  const product = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/products", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      name: "prod1",
      tax_category: "saas",
    }),
  }).then((res) => res.json());
  const productId = product.data.id;

  const price = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/prices", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      product_id: productId,
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
  }).then((res) => res.json());
  const priceId = price.data.id;

  const transaction = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        customer_id: customerId,
        items: [
          {
            price_id: priceId,
            quantity: 3,
          },
        ],
      }),
    },
  ).then((res) => res.json());

  const transactionId = transaction.data.id;

  const transactionGet = await fetch(
    `http://localhost:3001/https://sandbox-api.paddle.com/transactions/${transactionId}`,
    {
      method: "GET",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
    },
  );
  if (transactionGet.status !== 200) throw new Error();
  const transactionGetBody = await transactionGet.json();
  if (transactionGetBody.data.created_at !== "2024-01-01T00:00:00.000Z") throw new Error();
  if (transactionGetBody.data.id !== transactionId) throw new Error();
  if (transactionGetBody.data.status !== "draft") throw new Error();
  if (transactionGetBody.data.customer_id !== customerId) throw new Error();
  if (transactionGetBody.data.items.length !== 1) throw new Error();
  if (transactionGetBody.data.items[0].price_id !== priceId) throw new Error();
  if (transactionGetBody.data.items[0].quantity !== 3) throw new Error();
}

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
