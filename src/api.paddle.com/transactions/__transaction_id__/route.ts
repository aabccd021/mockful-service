import type { Context } from "@src/util.ts";
import * as get from "./get.ts";

export async function handle(
  ctx: Context,
  paths: string[],
  transactionId: string,
): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (ctx.req.method === "GET") {
      return get.handle(ctx, transactionId);
    }
  }
  return new Response("Not Found", { status: 404 });
}
