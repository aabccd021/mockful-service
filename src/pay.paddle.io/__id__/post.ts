import type * as sqlite from "bun:sqlite";
import { type Context, getStringFormData } from "@src/util.ts";

export async function handle(ctx: Context, checkoutId: string): Promise<Response> {
  const searchParams = new URL(ctx.req.url).searchParams;
  const transactionId = searchParams.get("transaction_id");
  if (transactionId === null) {
    return Response.json("Missing required parameter: transaction_id", { status: 400 });
  }

  const formData = await getStringFormData(ctx);

  const customerId = formData.get("customer_id");
  if (customerId === undefined) {
    return Response.json("Missing required parameter: customer_id", { status: 400 });
  }

  const customer = ctx.db
    .query<{ email: string | null }, sqlite.SQLQueryBindings>(
      "SELECT email FROM paddle_customer WHERE id = :customer_id",
    )
    .get({ customer_id: customerId });
  if (customer === null) {
    return Response.json(`Customer with id ${customerId} doesn't exists`, { status: 400 });
  }

  const checkout = ctx.db
    .query<{ redirect_url: string }, sqlite.SQLQueryBindings>(
      "SELECT redirect_url FROM paddle_hosted_checkout WHERE id = :checkout_id",
    )
    .get({ checkout_id: checkoutId });

  if (checkout === null) {
    throw new Error("Absurd");
  }

  const redirectUrl = new URL(checkout.redirect_url);
  redirectUrl.searchParams.set("paddle_customer_id", customerId);
  redirectUrl.searchParams.set("transaction_id", transactionId);
  if (customer.email !== null) {
    redirectUrl.searchParams.set("customer_email", customer.email);
  }

  return Response.redirect(redirectUrl, 303);
}
