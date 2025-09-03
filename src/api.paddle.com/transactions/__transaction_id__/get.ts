import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

type Row = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
};

export async function handle(ctx: Context, transactionId: string): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const transaction = ctx.db
    .query<Row, sqlite.SQLQueryBindings>(`
    SELECT 
      paddle_transaction.id AS id
    FROM paddle_transaction
    INNER JOIN paddle_customer
      ON paddle_transaction.customer_id = paddle_customer.id
    WHERE paddle_transaction.id = :transaction_id
      AND paddle_customer.account_id = :account_id
  `)
    .get({ transaction_id: transactionId, account_id: account.id });

  if (transaction === null) {
    return Response.json({}, { status: 404 });
  }

  return Response.json({ data: transaction });
}
