import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("all");
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

  const customer1 = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  }).then((res) => res.json());
  const customer1Id = customer1.data.id;

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

  const transaction1 = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        customer_id: customer1Id,
        items: [
          {
            price_id: priceId,
            quantity: 2,
          },
        ],
      }),
    },
  ).then((res) => res.json());

  const transaction2 = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        customer_id: customer1Id,
        items: [
          {
            price_id: priceId,
            quantity: 3,
          },
          {
            price_id: priceId,
            quantity: 6,
          },
        ],
      }),
    },
  ).then((res) => res.json());

  const transactionGet = await fetch(
    `http://localhost:3001/https://sandbox-api.paddle.com/transactions`,
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
  if (transactionGetBody.data.length !== 2) throw new Error();

  if (transactionGetBody.data[0].created_at !== "2024-01-01T00:00:00.000Z") throw new Error();
  if (transactionGetBody.data[0].id !== transaction1.data.id) throw new Error();
  if (transactionGetBody.data[0].status !== "draft") throw new Error();
  if (transactionGetBody.data[0].customer_id !== customer1Id) throw new Error();
  if (transactionGetBody.data[0].items.length !== 1) throw new Error();
  if (transactionGetBody.data[0].items[0].price_id !== priceId) throw new Error();
  if (transactionGetBody.data[0].items[0].quantity !== 2) throw new Error();

  if (transactionGetBody.data[1].created_at !== "2024-01-01T00:00:00.000Z") throw new Error();
  if (transactionGetBody.data[1].id !== transaction2.data.id) throw new Error();
  if (transactionGetBody.data[1].status !== "draft") throw new Error();
  if (transactionGetBody.data[1].customer_id !== customer1Id) throw new Error();
  if (transactionGetBody.data[1].items.length !== 2) throw new Error();
  if (transactionGetBody.data[1].items[0].price_id !== priceId) throw new Error();
  if (transactionGetBody.data[1].items[0].quantity !== 3) throw new Error();
  if (transactionGetBody.data[1].items[1].price_id !== priceId) throw new Error();
  if (transactionGetBody.data[1].items[1].quantity !== 6) throw new Error();
}

{
  console.info("by customer id");
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

  const customer1 = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  }).then((res) => res.json());
  const customer1Id = customer1.data.id;

  const customer2 = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "kita@example.com",
    }),
  }).then((res) => res.json());
  const customer2Id = customer2.data.id;

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

  const transaction1 = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        customer_id: customer1Id,
        items: [
          {
            price_id: priceId,
            quantity: 2,
          },
        ],
      }),
    },
  ).then((res) => res.json());

  const transaction2 = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/transactions",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        customer_id: customer2Id,
        items: [
          {
            price_id: priceId,
            quantity: 3,
          },
          {
            price_id: priceId,
            quantity: 6,
          },
        ],
      }),
    },
  ).then((res) => res.json());

  {
    const url = new URL("http://localhost:3001/https://sandbox-api.paddle.com/transactions");
    url.searchParams.append("customer_id", customer1Id);

    const transactionGet = await fetch(url, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
    });
    if (transactionGet.status !== 200) throw new Error();
    const transactionGetBody = await transactionGet.json();
    if (transactionGetBody.data.length !== 1) throw new Error();

    if (transactionGetBody.data[0].created_at !== "2024-01-01T00:00:00.000Z") throw new Error();
    if (transactionGetBody.data[0].id !== transaction1.data.id) throw new Error();
    if (transactionGetBody.data[0].status !== "draft") throw new Error();
    if (transactionGetBody.data[0].customer_id !== customer1Id) throw new Error();
    if (transactionGetBody.data[0].items.length !== 1) throw new Error();
    if (transactionGetBody.data[0].items[0].price_id !== priceId) throw new Error();
    if (transactionGetBody.data[0].items[0].quantity !== 2) throw new Error();
  }

  {
    const url = new URL("http://localhost:3001/https://sandbox-api.paddle.com/transactions");
    url.searchParams.append("customer_id", customer2Id);

    const transactionGet = await fetch(url, {
      method: "GET",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
    });
    if (transactionGet.status !== 200) throw new Error();
    const transactionGetBody = await transactionGet.json();
    if (transactionGetBody.data.length !== 1) throw new Error();

    if (transactionGetBody.data[0].created_at !== "2024-01-01T00:00:00.000Z") throw new Error();
    if (transactionGetBody.data[0].id !== transaction2.data.id) throw new Error();
    if (transactionGetBody.data[0].status !== "draft") throw new Error();
    if (transactionGetBody.data[0].customer_id !== customer2Id) throw new Error();
    if (transactionGetBody.data[0].items.length !== 2) throw new Error();
    if (transactionGetBody.data[0].items[0].price_id !== priceId) throw new Error();
    if (transactionGetBody.data[0].items[0].quantity !== 3) throw new Error();
    if (transactionGetBody.data[0].items[1].price_id !== priceId) throw new Error();
    if (transactionGetBody.data[0].items[1].quantity !== 6) throw new Error();
  }
}
