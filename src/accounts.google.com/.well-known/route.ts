import type { Context } from "@src/util.ts";
import * as openidConfiguration from "./openid-configuration/route.ts"

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "openid-configuration") {
    return openidConfiguration.handle(ctx, subPaths)
  }

  return new Response("Not Found", { status: 404 });
}
