import type { Context } from "@util.ts";
import * as customers from "./customers/_route.ts";

export async function handle(req: Request, ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "customers") {
    return customers.handle(req, ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
