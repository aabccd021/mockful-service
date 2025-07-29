import type { Context } from "@util.ts";
import * as oauth2 from "./oauth2/_route.ts";

export async function handle(req: Request, ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "oauth2") {
    return oauth2.handle(req, ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
