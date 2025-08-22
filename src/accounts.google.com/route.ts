import type { Context } from "@util";
import * as o from "./o/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "o") {
    return o.handle(ctx, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
