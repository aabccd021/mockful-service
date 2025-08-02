import * as v2 from "./v2/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "v2") {
    return v2.handle(req, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
