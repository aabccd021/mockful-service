import type { Context } from "@util";
import * as api from "./api/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "api") {
    return api.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
