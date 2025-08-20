import type { Context } from "@util";
export function handle(_ctx: Context): Response {
  return new Response("Not Implemented", {
    status: 501,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
