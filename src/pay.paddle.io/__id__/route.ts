import type { Context } from "@src/util.ts";
import * as get from "./get.ts";
import * as post from "./post.ts";

export async function handle(ctx: Context, paths: string[], id: string): Promise<Response> {
  if (paths.length === 0) {
    if (ctx.req.method === "POST") {
      return post.handle(ctx, id);
    }
    if (ctx.req.method === "GET") {
      return get.handle(ctx, id);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response("Not Found", { status: 404 });
}
