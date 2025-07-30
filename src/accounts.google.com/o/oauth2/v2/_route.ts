import type { Context } from "@util.ts";
import * as auth from "./auth/_route.ts";

export async function handle(req: Request, ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "auth") {
    return auth.handle(req, ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
