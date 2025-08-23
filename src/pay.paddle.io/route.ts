import type { Context } from "@src/util.ts";
import * as __id__ from "./__id__/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [id, ...subPaths] = paths;
  if (id !== undefined) {
    return __id__.handle(ctx, subPaths, id);
  }
  return new Response("Not Found", { status: 404 });
}
