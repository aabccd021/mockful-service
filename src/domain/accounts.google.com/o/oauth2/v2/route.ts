import type { Context } from "@util/index.ts";
import * as auth from "./auth/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "auth") {
    return auth.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
