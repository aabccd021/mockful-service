import type { Context } from "@util";
import * as o from "./o/route.ts";
import * as signin from "./signin/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "o") {
    return o.handle(ctx, subPaths);
  }

  if (path === "signin") {
    return signin.handle(ctx, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
