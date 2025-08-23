import type { Context } from "@src/util.ts";
import * as customers from "./customers/route.ts";
import * as prices from "./prices/route.ts";
import * as products from "./products/route.ts";
import * as transactions from "./transactions/route.ts";

export async function handle(ctx: Context, paths: string[]): Promise<Response> {
  const [path, ...subPaths] = paths;

  if (path === "customers") {
    return customers.handle(ctx, subPaths);
  }

  if (path === "products") {
    return products.handle(ctx, subPaths);
  }

  if (path === "prices") {
    return prices.handle(ctx, subPaths);
  }

  if (path === "transactions") {
    return transactions.handle(ctx, subPaths);
  }

  return new Response("Not Found", { status: 404 });
}
