import * as sqlite from "bun:sqlite";
import * as test from "@src/test-util";

using ctx = test.init();

{
  console.info("can send message");

  test.resetDb(ctx);
  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO discord_webhook (id, token) VALUES ('mock_webhook_id', "mock_webhook_token")
  `);

  const response = await fetch(
    `http://localhost:3001/https://discord.com/api/webhooks/mock_webhook_id/mock_webhook_token`,
    {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    },
  );

  if (response.status !== 200) throw new Error();

  const messages = new sqlite.Database(ctx.dbPath)
    .query<{ webhook_id: string; webhook_token: string; method: string; body: string }, []>(
      "SELECT webhook_id,webhook_token,method,body FROM discord_webhook_request",
    )
    .all();

  const [message, secondMessage] = messages;
  if (message === undefined) throw new Error();
  if (secondMessage !== undefined) throw new Error();

  if (message.webhook_id !== "mock_webhook_id") throw new Error();
  if (message.webhook_token !== "mock_webhook_token") throw new Error();
  if (message.method !== "POST") throw new Error();

  const messageBody = JSON.parse(message.body);
  if (messageBody.content !== "hello") throw new Error();
}

{
  console.info("error sending message if webhook is not registered");

  test.resetDb(ctx);

  const response = await fetch(
    `http://localhost:3001/https://discord.com/api/webhooks/mock_webhook_id/mock_webhook_token`,
    {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    },
  );

  if (response.status !== 400) throw new Error();

  const messages = new sqlite.Database(ctx.dbPath)
    .query<{ webhook_id: string; webhook_token: string; method: string; body: string }, []>(
      "SELECT webhook_id,webhook_token,method,body FROM discord_webhook_request",
    )
    .all();

  if (messages.length !== 0) throw new Error();
}
