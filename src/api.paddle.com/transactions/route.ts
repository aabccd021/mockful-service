import type { Context } from "@src/util.ts";
import * as __transaction_id__ from "./__transaction_id__/route.ts";
import * as get from "./get.ts";
import * as post from "./post.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [transactionId, ...subPaths] = paths;
  if (transactionId === undefined) {
    if (ctx.req.method === "POST") {
      return post.handle(ctx);
    }
    if (ctx.req.method === "GET") {
      return get.handle(ctx);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }

  return __transaction_id__.handle(ctx, subPaths, transactionId);
}
