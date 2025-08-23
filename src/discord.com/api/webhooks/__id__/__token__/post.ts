import type { Context } from "@util";

export async function handle(
  ctx: Context,
  webhook: { id: string; token: string },
): Promise<Response> {
  try {
    ctx.db
      .query(`
        INSERT INTO discord_webhook_request (webhook_id, webhook_token, method, body) 
        VALUES (:webhook_id, :webhook_token, :method, :body)
      `)
      .run({
        webhook_id: webhook.id,
        webhook_token: webhook.token,
        method: ctx.req.method,
        body: await ctx.req.text(),
      });
  } catch (_err) {
    // TODO
    return new Response("TODO", { status: 400 });
  }

  return new Response("", { status: 200 });
}
