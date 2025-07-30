import type { Context } from "@util.ts";
import * as _post from "./_post.ts";

export async function handle(req: Request, ctx: Context, paths: string[]): Promise<Response> {
  if (paths.length === 0) {
    if (req.method === "POST") {
      return _post.handle(req, ctx);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response("Not Found", { status: 404 });
}
