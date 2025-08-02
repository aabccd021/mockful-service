import * as error from "./error/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;
  if (path === "error") {
    return error.handle(req, subPaths);
  }
  return new Response("Not Found", { status: 404 });
}
