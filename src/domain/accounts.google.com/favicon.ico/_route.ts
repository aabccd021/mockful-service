import * as _get from "./_get.ts";

// https://www.google.com/favicon.ico
export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (req.method === "GET") {
      return _get.handle(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }

  return new Response("Not Found", { status: 404 });
}
