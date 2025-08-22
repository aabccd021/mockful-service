import * as sqlite from "bun:sqlite";
import * as test from "@test-util";

using ctx = test.init();

{
  console.info("can send message");

  test.resetDb(ctx);

  const response = await fetch(
    `http://localhost:3001/https://discord.com/api/webhooks/mock_webhook_id/mock_webhook_token`,
    {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
    },
  );

  if (response.status !== 200) throw new Error();

  const messages = new sqlite.Database(ctx.dbPath)
    .query<{ url: string; method: string; body: string }, []>(
      "SELECT url,method,body FROM global_captured_response",
    )
    .all();

  if (messages.length > 1) throw new Error();

  const [message] = messages;
  if (message === undefined) throw new Error();

  if (message.url !== "https://discord.com/api/webhooks/mock_webhook_id/mock_webhook_token")
    throw new Error();
  if (message.method !== "POST") throw new Error();

  const messageBody = JSON.parse(message.body);
  if (messageBody.content !== "hello") throw new Error();
}
