import type { Context } from "@util/index.ts";
import * as customers from "./customers/_route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "customers") {
    return customers.handle(ctx, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
