import type { Context } from "@util/index.ts";
import * as error from "./error/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "error") {
    return error.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
