import type * as sqlite from "bun:sqlite";
import { type Context, nowIso } from "@src/util.ts";

export async function handle(ctx: Context, checkoutId: string): Promise<Response> {
  const searchParams = new URL(ctx.req.url).searchParams;
  const transactionId = searchParams.get("transaction_id");
  if (transactionId === null) {
    return Response.json("Missing required parameter: transaction_id", { status: 400 });
  }

  const customer = ctx.db
    .query<{ id: string; email: string }, sqlite.SQLQueryBindings>(
      `
        SELECT c.id, c.email
        FROM paddle_transaction t
          JOIN paddle_customer c ON t.customer_id = c.id
        WHERE t.id = :transaction_id
      `,
    )
    .get({ transaction_id: transactionId });

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

  const nextStatus = stringFormData.get("next_status");
  if (nextStatus !== "paid" && nextStatus !== "completed") {
    return Response.json("Invalid next_status", { status: 400 });
  }

  const billedAt = nextStatus === "completed" ? nowIso(ctx) : null;

  ctx.db
    .query(`
      UPDATE paddle_transaction 
      SET status = :status, billed_at = :billed_at
      WHERE id = :transaction_id
    `)
    .run({
      status: nextStatus,
      billed_at: billedAt,
      transaction_id: transactionId,
    });

  const redirectUrl = new URL(checkout.redirect_url);
  redirectUrl.searchParams.set("paddle_customer_id", customer.id);
  redirectUrl.searchParams.set("transaction_id", transactionId);
  redirectUrl.searchParams.set("customer_email", customer.email);

  return Response.redirect(redirectUrl, 303);
}
