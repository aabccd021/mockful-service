import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("by emails");

  test.resetDb(ctx);

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

  await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "kita@example.com",
    }),
  });

  await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "yamada@example.com",
    }),
  });

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("email", "nijika@example.com,yamada@example.com");

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 2) throw new Error();
  if (customers[0]?.email !== "nijika@example.com") throw new Error();
  if (customers[1]?.email !== "yamada@example.com") throw new Error();
}

{
  console.info("by email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const createResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "nijika@example.com",
      }),
    },
  );

  const createResponseBody = await createResponse.json();
  const customerId = createResponseBody.data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("email", "nijika@example.com");

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 1) throw new Error();
  if (customers[0]?.email !== "nijika@example.com") throw new Error();
  if (customers[0]?.id !== customerId) throw new Error();
}

{
  console.info("by ids");

  test.resetDb(ctx);

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
  if (customers.length !== 2) throw new Error();
  if (customers[0]?.email !== "kita@example.com") throw new Error();
  if (customers[0]?.id !== kitaId) throw new Error();
  if (customers[1]?.email !== "yamada@example.com") throw new Error();
  if (customers[1]?.id !== yamadaId) throw new Error();
}

{
  console.info("success");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const createResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "nijika@example.com",
      }),
    },
  );

  const createResponseBody = await createResponse.json();
  const customerId = createResponseBody.data.id;

  const response = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 1) throw new Error();
  if (customers[0]?.email !== "nijika@example.com") throw new Error();
  if (customers[0]?.id !== customerId) throw new Error();
  if (customers[0]?.status !== "active") throw new Error();
  if (customers[0]?.marketing_consent !== false) throw new Error();
  if (customers[0]?.locale !== "en") throw new Error();
}

const parameters = [
  { email: ["kita"], result: ["kita"] },
  { email: ["yamada"], result: ["yamada"] },
  { email: ["kita", "yamada"], result: ["kita", "yamada"] },
  { id: ["kita"], result: ["kita"] },
  { id: ["kita"], email: ["kita"], result: ["kita"] },
  { id: ["kita"], email: ["yamada"], result: [] },
  { id: ["kita"], email: ["kita", "yamada"], result: ["kita"] },
  { id: ["yamada"], result: ["yamada"] },
  { id: ["yamada"], email: ["kita"], result: [] },
  { id: ["yamada"], email: ["yamada"], result: ["yamada"] },
  { id: ["yamada"], email: ["kita", "yamada"], result: ["yamada"] },
  { id: ["kita", "yamada"], result: ["kita", "yamada"] },
  { id: ["kita", "yamada"], email: ["kita"], result: ["kita"] },
  { id: ["kita", "yamada"], email: ["yamada"], result: ["yamada"] },
  { id: ["kita", "yamada"], email: ["kita", "yamada"], result: ["kita", "yamada"] },
  { result: ["kita", "nijika", "yamada"] },
];

for (const param of parameters) {
  console.info(`parameterized: ${JSON.stringify(param)}`);

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const nijika = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "nijika@example.com",
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data);

  const kita = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "kita@example.com",
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data);

  const yamada = await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "yamada@example.com",
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data);

  const customers = { nijika, kita, yamada };

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");

  if (param.email !== undefined) {
    const emailParams = Object.entries(customers)
      .filter(([key]) => param.email.includes(key))
      .map(([, customer]) => customer.email);
    listUrl.searchParams.set("email", emailParams.join(","));
  }

  if (param.id !== undefined) {
    const idParams = Object.entries(customers)
      .filter(([key]) => param.id.includes(key))
      .map(([, customer]) => customer.id);
    listUrl.searchParams.set("id", idParams.join(","));
  }

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const responseEmails = responseBody.data.map((c: { email: string }) => c.email).toSorted();

  const expectedEmails = Object.entries(customers)
    .filter(([key]) => param.result.includes(key))
    .map(([, customer]) => customer.email)
    .toSorted();

  for (const [emailIdx, email] of expectedEmails.entries()) {
    if (responseEmails[emailIdx] !== email) {
      console.error({ expectedEmails, responseEmails });
      throw new Error();
    }
  }
}
