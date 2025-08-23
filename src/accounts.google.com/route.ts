import type { Context } from "@src/util.ts";
import * as wellKnown from "./.well-known/route.ts";
import * as o from "./o/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "o") {
    return o.handle(ctx, subPaths);
  }

  if (path === ".well-known") {
    return wellKnown.handle(ctx, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
