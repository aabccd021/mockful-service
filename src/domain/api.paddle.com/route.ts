import * as customers from "./customers/route.ts";
import * as prices from "./prices/route.ts";
import * as products from "./products/route.ts";
import * as transactions from "./transactions/route.ts";

export async function handle(req: Request, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "customers") {
    return customers.handle(req, subPaths);
  }

  if (path === "products") {
    return products.handle(req, subPaths);
  }

  if (path === "prices") {
    return prices.handle(req, subPaths);
  }

  if (path === "transactions") {
    return transactions.handle(req, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
