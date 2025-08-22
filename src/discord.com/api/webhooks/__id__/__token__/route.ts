import type { Context } from "@util";
import * as post from "./post.ts";

export async function handle(
  ctx: Context,
  paths: string[],
  webhook: { id: string; token: string },
): Promise<Response> {
  if (paths.length === 0) {
    if (ctx.req.method === "POST") {
      return post.handle(ctx, webhook);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response("Not Found", { status: 404 });
}
