import type { Context } from "@util/index.ts";

export function handle(_req: Request, _ctx: Context): Response {
  return Response.redirect("https://www.google.com/favicon.ico", 301);
}
