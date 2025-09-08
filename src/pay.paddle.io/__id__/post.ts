import type * as sqlite from "bun:sqlite";
import { type Context, dateNow } from "@src/util.ts";

export async function handle(ctx: Context, checkoutId: string): Promise<Response> {
  const searchParams = new URL(ctx.req.url).searchParams;
  const transactionId = searchParams.get("transaction_id");
  if (transactionId === null) {
    return Response.json("Missing required parameter: transaction_id", { status: 400 });
  }

  const customer = ctx.db
    .query<{ id: string; email: string }, sqlite.SQLQueryBindings>(
      `
        SELECT paddle_customer.id, paddle_customer.email
        FROM paddle_transaction
        JOIN paddle_customer 
          ON paddle_transaction.customer_id = paddle_customer.id
        WHERE paddle_transaction.id = :transactionId
      `,
    )
    .get({ transactionId });

  if (customer === null) {
    throw new Error("Absurd");
  }

  const checkout = ctx.db
    .query<{ redirect_url: string }, sqlite.SQLQueryBindings>(
      "SELECT redirect_url FROM paddle_hosted_checkout WHERE id = :checkout_id",
    )
    .get({ checkout_id: checkoutId });

  if (checkout === null) {
    throw new Error("Absurd");
  }

  const formData = await ctx.req.formData();
  const stringFormData = new Map(formData.entries());

  const status = stringFormData.get("status");
  if (status !== "paid" && status !== "completed") {
    return Response.json(`Invalid status: ${status}`, { status: 400 });
  }

  const billedAtEpochMs = status === "completed" ? dateNow(ctx).getTime() : null;

  ctx.db
    .query(`
      UPDATE paddle_transaction 
      SET status = :status, billed_at_epoch_ms = :billedAtEpochMs
      WHERE id = :transactionId
    `)
    .run({ status, billedAtEpochMs, transactionId });

  const redirectUrl = new URL(checkout.redirect_url);
  redirectUrl.searchParams.set("paddle_customer_id", customer.id);
  redirectUrl.searchParams.set("transaction_id", transactionId);
  redirectUrl.searchParams.set("customer_email", customer.email);

  return Response.redirect(redirectUrl, 303);
}
