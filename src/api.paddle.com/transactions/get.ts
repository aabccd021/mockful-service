import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string;
  created_at_epoch_ms: number;
  billed_at_epoch_ms: number | null;
};

type TransactionItemRow = {
  price_id: string;
  quantity: number;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const params = new URL(ctx.req.url).searchParams;

  const query = {
    customer_id: params.get("customer_id")?.split(",") ?? [null],
  };

  const argCombinations = query.customer_id.map((customerId) => ({ customerId }));

  const transactions = argCombinations.flatMap(({ customerId }) =>
    ctx.db
      .query<TransactionRow, sqlite.SQLQueryBindings>(`
    SELECT 
      paddle_transaction.id AS id,
      paddle_transaction.status AS status,
      paddle_transaction.customer_id AS customer_id,
      paddle_transaction.created_at_epoch_ms AS created_at_epoch_ms,
      paddle_transaction.billed_at_epoch_ms AS billed_at_epoch_ms
    FROM paddle_transaction
    INNER JOIN paddle_customer
      ON paddle_transaction.customer_id = paddle_customer.id
    WHERE paddle_customer.account_id = :accountId
      AND (:customerId IS NULL OR paddle_transaction.customer_id = :customerId)
  `)
      .all({ customerId, accountId: account.id }),
  );

  const data = transactions.map((transaction) => {
    const transactionItems = ctx.db
      .query<TransactionItemRow, sqlite.SQLQueryBindings>(`
    SELECT 
      price_id,
      quantity
    FROM paddle_transaction_item
    WHERE transaction_id = :transactionId
  `)
      .all({ transactionId: transaction.id });

    const billedAt = transaction.billed_at_epoch_ms
      ? new Date(transaction.billed_at_epoch_ms).toISOString()
      : null;

    return {
      id: transaction.id,
      status: transaction.status,
      customer_id: transaction.customer_id,
      created_at: new Date(transaction.created_at_epoch_ms).toISOString(),
      billed_at: billedAt,
      items: transactionItems.map((item) => ({
        price_id: item.price_id,
        quantity: item.quantity,
      })),
    };
  });

  return Response.json({ data });
}
