import type { Context } from "@util/index.ts";
import * as v2 from "./v2/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "v2") {
    return v2.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
