import type { Context } from "@util";
import * as token from "./token/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "token") {
    return token.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
