import type * as sqlite from "bun:sqlite";
import type { Context } from "@src/util.ts";

export async function handle(ctx: Context, checkoutId: string): Promise<Response> {
  const checkout = ctx.db
    .query<{ redirect_url: string }, sqlite.SQLQueryBindings>(
      "SELECT redirect_url FROM paddle_hosted_checkout WHERE id = :checkout_id",
    )
    .get({ checkout_id: checkoutId });

  if (checkout === null) {
    throw new Error("Absurd");
  }

  return Response.redirect(checkout.redirect_url);
}
