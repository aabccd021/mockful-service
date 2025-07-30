import type { Context } from "util/index.ts";
import * as faviconIco from "./favicon.ico/_route.ts";
import * as o from "./o/_route.ts";
import * as signin from "./signin/_route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "o") {
    return o.handle(ctx, subPaths);
  }

  if (path === "favicon.ico") {
    return faviconIco.handle(ctx, subPaths);
  }

  if (path === "signin") {
    return signin.handle(ctx, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
