import type { Context } from "util/index.ts";
import * as token from "./token/_route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "token") {
    return token.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
