import type { Context } from "@util.ts";
import * as token from "./token/_route.ts";

export async function handle(req: Request, ctx: Context, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === "token") {
    return token.handle(req, ctx);
  }
  return new Response("Not Found", { status: 404 });
}
