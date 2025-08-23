import type { Context } from "@src/util.ts";
import * as webhooks from "./webhooks/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "webhooks") {
    return webhooks.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
