import type { Context } from "../util";

export async function handle(_req: Request, _ctx: Context): Promise<Response> {
  return new Response("Method Not Allowed", { status: 405 });
}
