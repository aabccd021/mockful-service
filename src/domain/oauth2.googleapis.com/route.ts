import * as token from "./token/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "token") {
    return token.handle(req, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
