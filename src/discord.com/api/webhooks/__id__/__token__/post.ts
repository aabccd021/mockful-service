import type { Context } from "@util";

export async function handle(
  ctx: Context,
  _webhook: { id: string; token: string },
): Promise<Response> {
  const id = crypto.randomUUID();

  ctx.db
    .query(`
    INSERT INTO discord_webhook_request (id, url, method, body) 
    VALUES (:id, :url, :method, :body)
  `)
    .run({
      id,
      url: ctx.req.url,
      method: ctx.req.method,
      body: await ctx.req.text(),
    });

  return new Response("", { status: 200 });
}
