import * as oauth from "./oauth/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "oauth") {
    return oauth.handle(req, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
