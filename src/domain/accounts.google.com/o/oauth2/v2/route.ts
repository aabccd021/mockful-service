import * as auth from "./auth/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "auth") {
    return auth.handle(req, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
