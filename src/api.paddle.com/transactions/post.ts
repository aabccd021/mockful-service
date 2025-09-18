import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import { type Context, dateNow } from "@src/util.ts";

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string | null;
  created_at_epoch_ms: number;
};

// TODO:L
// {
//   "error": {
//     "type": "request_error",
//     "code": "transaction_default_checkout_url_not_set",
//     "detail": "A Default Payment Link has not yet been defined within the Paddle Dashboard for this account, find this under checkout settings. ",
//     "documentation_url": "https://developer.paddle.com/v1/errors/transactions/transaction_default_checkout_url_not_set"
//   },
//   "meta": {
//     "request_id": "46921b47-b4f1-4eae-974d-ab7cb9590c42"
//   }
// }

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await ctx.req.json();

  const id = `txn_${paddle.generateId()}`;
  const now = dateNow(ctx);

  const transaction = {
    id,
    status: "draft",
    customer_id: reqBody.customer_id ?? null,
    created_at_epoch_ms: now.getTime(),
  };

  ctx.db.transaction(() => {
    ctx.db
      .query<TransactionRow, sqlite.SQLQueryBindings>(`
        INSERT INTO paddle_transaction (created_at_epoch_ms, id, status, customer_id) 
        VALUES (:created_at_epoch_ms, :id, :status, :customer_id)
      `)
      .get(transaction);
    for (const item of reqBody.items) {
      ctx.db
        .query(`
          INSERT INTO paddle_transaction_item (transaction_id, price_id, quantity) 
          VALUES (:transaction_id, :priceId, :quantity)
        `)
        .run({
          transaction_id: id,
          priceId: item.price_id,
          quantity: item.quantity,
        });
    }
  })();

  return Response.json(
    {
      data: {
        id: transaction.id,
        status: transaction.status,
        customer_id: transaction.customer_id,
        created_at: new Date(transaction.created_at_epoch_ms).toISOString(),
        items: reqBody.items,
      },
    },
    { status: 201 },
  );
}
