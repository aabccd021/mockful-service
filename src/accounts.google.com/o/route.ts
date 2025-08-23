import type { Context } from "@src/util.ts";
import * as oauth2 from "./oauth2/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "oauth2") {
    return oauth2.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
