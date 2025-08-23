import type * as sqlite from "bun:sqlite";
import type { Context } from "@src/util.ts";

export async function handle(
  ctx: Context,
  reqWebhook: { id: string; token: string },
): Promise<Response> {
  const webhook = ctx.db
    .query<{ token: string }, sqlite.SQLQueryBindings>(
      "SELECT token FROM discord_webhook WHERE id = :id",
    )
    .get({
      id: reqWebhook.id,
    });
  if (webhook === null) {
    return Response.json(
      {
        message: "Unknown Webhook",
        code: 10015,
      },
      { status: 404 },
    );
  }

  if (webhook.token !== reqWebhook.token) {
    return Response.json(
      {
        message: "Invalid Webhook Token",
        code: 50027,
      },
      { status: 401 },
    );
  }

  if (ctx.req.headers.get("content-type")?.startsWith("application/json") !== true) {
    return Response.json(
      {
        _misc: [
          `Expected "Content-Type" header to be one of {'multipart/form-data', 'application/x-www-form-urlencoded', 'application/json'}.`,
        ],
      },
      { status: 400 },
    );
  }

  ctx.db
    .query(`
        INSERT INTO discord_webhook_request (webhook_id, webhook_token, method, body) 
        VALUES (:webhook_id, :webhook_token, :method, :body)
      `)
    .run({
      webhook_id: reqWebhook.id,
      webhook_token: reqWebhook.token,
      method: ctx.req.method,
      body: await ctx.req.text(),
    });

  return new Response("", { status: 204 });
}
