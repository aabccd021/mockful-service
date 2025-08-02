import * as post from "./post.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path] = paths;
  if (path === undefined) {
    if (req.method === "POST") {
      return post.handle(req);
    }
    return new Response("Method Not Allowed", { status: 405 });
  }
  return new Response("Not Found", { status: 404 });
}
