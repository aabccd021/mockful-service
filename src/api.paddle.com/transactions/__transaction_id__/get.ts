import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string;
  created_at: string;
};

type TransactionItemRow = {
  price_id: string;
  quantity: number;
};

export async function handle(ctx: Context, transactionId: string): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const transactionRow = ctx.db
    .query<TransactionRow, sqlite.SQLQueryBindings>(`
    SELECT 
      paddle_transaction.id AS id,
      paddle_transaction.status AS status,
      paddle_transaction.customer_id AS customer_id,
      paddle_transaction.created_at AS created_at
    FROM paddle_transaction
    INNER JOIN paddle_customer
      ON paddle_transaction.customer_id = paddle_customer.id
    WHERE paddle_transaction.id = :transaction_id
      AND paddle_customer.account_id = :account_id
  `)
    .get({ transaction_id: transactionId, account_id: account.id });

  if (transactionRow === null) {
    return Response.json({}, { status: 404 });
  }

  const transactionItemRows = ctx.db
    .query<TransactionItemRow, sqlite.SQLQueryBindings>(`
    SELECT 
      price_id,
      quantity
    FROM paddle_transaction_item
    WHERE transaction_id = :transaction_id
  `)
    .all({ transaction_id: transactionId });

  const data = {
    id: transactionRow.id,
    status: transactionRow.status,
    customer_id: transactionRow.customer_id,
    created_at: transactionRow.created_at,
    items: transactionItemRows.map((item) => ({
      price_id: item.price_id,
      quantity: item.quantity,
    })),
  };

  return Response.json({ data });
}
