import type { Context } from "@util";
import * as post from "./post.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (ctx.req.method === "POST") {
      return post.handle(ctx);
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response("Not Found", { status: 404 });
}
