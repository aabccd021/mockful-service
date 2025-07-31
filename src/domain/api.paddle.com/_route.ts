import * as customers from "./customers/_route.ts";
import * as products from "./products/_route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "customers") {
    return customers.handle(req, subPaths);
  }

  if (path === "products") {
    return products.handle(req, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
