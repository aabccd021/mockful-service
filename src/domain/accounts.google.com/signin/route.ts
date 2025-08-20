import type { Context } from "@util/index.ts";
import * as oauth from "./oauth/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "oauth") {
    return oauth.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
