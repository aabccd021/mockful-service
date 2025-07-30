import * as faviconIco from "./favicon.ico/_route.ts";
import * as o from "./o/_route.ts";
import * as signin from "./signin/_route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "o") {
    return o.handle(req, subPaths);
  }

  if (path === "favicon.ico") {
    return faviconIco.handle(req, subPaths);
  }

  if (path === "signin") {
    return signin.handle(req, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
