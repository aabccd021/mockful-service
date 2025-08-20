import type { Context } from "@util";
export function handle(_ctx: Context): Response {
  return Response.redirect("https://www.google.com/favicon.ico", 301);
}
