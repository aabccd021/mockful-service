import type { Context } from "@util/index.ts";
import * as get from "./get.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (ctx.req.method === "GET") {
      return get.handle(ctx);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }

  return new Response("Not Found", { status: 404 });
}
