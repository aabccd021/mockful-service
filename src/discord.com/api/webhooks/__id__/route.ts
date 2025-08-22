import type { Context } from "@util";
import * as __token__ from "./__token__/route.ts";

export async function handle(ctx: Context, paths: string[], id: string): Promise<Response> {
  const [token, ...subPaths] = paths;
  if (token !== undefined) {
    return __token__.handle(ctx, subPaths, { id, token });
  }
  return new Response("Not Found", { status: 404 });
}
