import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("by one id");

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
        email: "foo@example.com",
      }),
    },
  );

  const createResponseBody = await createResponse.json();
  const customerId = createResponseBody.data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", customerId);

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
  if (customers[0]?.email !== "foo@example.com") throw new Error();
  if (customers[0]?.id !== customerId) throw new Error();
}

{
  console.info("by id and matching email");

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
        email: "foo@example.com",
      }),
    },
  );

  const createResponseBody = await createResponse.json();
  const customerId = createResponseBody.data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", customerId);
  listUrl.searchParams.set("email", "foo@example.com");

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
  if (customers[0]?.email !== "foo@example.com") throw new Error();
  if (customers[0]?.id !== customerId) throw new Error();
}

{
  console.info("by id and non-matching email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );

  const fooId = (await fooResponse.json()).data.id;

  await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "bar@example.com",
    }),
  });

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", fooId);
  listUrl.searchParams.set("email", "bar@example.com");

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 0) throw new Error();
}

{
  console.info("by multiple ids and no emails");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  const barResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "bar@example.com",
      }),
    },
  );
  const barId = (await barResponse.json()).data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", `${fooId},${barId}`);

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

  const emails = [customers[0]?.email, customers[1]?.email].sort();
  if (emails[0] !== "bar@example.com" || emails[1] !== "foo@example.com") throw new Error();

  const ids = [customers[0]?.id, customers[1]?.id].sort();
  if (ids[0] !== barId && ids[1] !== fooId) throw new Error();
}

{
  console.info("by one id and multiple emails including matching email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "bar@example.com",
    }),
  });

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", fooId);
  listUrl.searchParams.set("email", "foo@example.com,bar@example.com");

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
  if (customers[0]?.email !== "foo@example.com") throw new Error();
  if (customers[0]?.id !== fooId) throw new Error();
}

{
  console.info("by one id and multiple emails with no matching email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  await fetch("http://localhost:3001/https://sandbox-api.paddle.com/customers", {
    method: "POST",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
    body: JSON.stringify({
      email: "bar@example.com",
    }),
  });

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", fooId);
  listUrl.searchParams.set("email", "baz@example.com,qux@example.com");

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 0) throw new Error();
}

{
  console.info("by multiple ids and one matching email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  const barResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "bar@example.com",
      }),
    },
  );
  const barId = (await barResponse.json()).data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", `${fooId},${barId}`);
  listUrl.searchParams.set("email", "foo@example.com");

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
  if (customers[0]?.email !== "foo@example.com") throw new Error();
  if (customers[0]?.id !== fooId) throw new Error();
}

{
  console.info("by multiple ids and one non-matching email");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  const barResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "bar@example.com",
      }),
    },
  );
  const barId = (await barResponse.json()).data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", `${fooId},${barId}`);
  listUrl.searchParams.set("email", "baz@example.com");

  const response = await fetch(listUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
    },
  });

  if (response.status !== 200) throw new Error();
  const responseBody = await response.json();
  const customers = responseBody.data;
  if (customers.length !== 0) throw new Error();
}

{
  console.info("by multiple ids and multiple emails with some matches");

  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO paddle_account (id) VALUES ('mock_account_id');
    INSERT INTO paddle_api_key (account_id, key) VALUES (
      'mock_account_id', 
      'pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO'
    );
  `);

  const fooResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "foo@example.com",
      }),
    },
  );
  const fooId = (await fooResponse.json()).data.id;

  const barResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "bar@example.com",
      }),
    },
  );
  const barId = (await barResponse.json()).data.id;

  const bazResponse = await fetch(
    "http://localhost:3001/https://sandbox-api.paddle.com/customers",
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer pdl_live_apikey_01gtgztp8f4kek3yd4g1wrksa3_q6TGTJyvoIz7LDtXT65bX7_AQO",
      },
      body: JSON.stringify({
        email: "baz@example.com",
      }),
    },
  );
  const bazId = (await bazResponse.json()).data.id;

  const listUrl = new URL("http://localhost:3001/https://sandbox-api.paddle.com/customers");
  listUrl.searchParams.set("id", `${fooId},${barId},${bazId}`);
  listUrl.searchParams.set("email", "foo@example.com,baz@example.com");

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

  const emails = [customers[0]?.email, customers[1]?.email].sort();
  if (emails[0] !== "baz@example.com" || emails[1] !== "foo@example.com") throw new Error();

  const ids = [customers[0]?.id, customers[1]?.id].sort();
  if (ids[0] !== bazId && ids[1] !== fooId) throw new Error();
}
