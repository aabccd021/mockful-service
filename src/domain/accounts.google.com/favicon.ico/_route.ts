import type { Context } from "util/index.ts";
import * as _get from "./_get.ts";

// https://www.google.com/favicon.ico
export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (ctx.req.method === "GET") {
      return _get.handle(ctx);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }

  return new Response("Not Found", { status: 404 });
}
