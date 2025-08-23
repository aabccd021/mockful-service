import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string | null;
  collection_method: "automatic" | "manual";
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await ctx.req.json();

  const id = `txn_${paddle.generateId()}`;

  const insertTransaction = ctx.db.transaction(() => {
    ctx.db
      .query(
        `
        INSERT INTO paddle_transaction (
          id,
          status,
          customer_id,
          collection_method,
        ) VALUES (
          :id,
          :status,
          :customer_id,
          :collection_method,
        )
      `,
      )
      .run({
        id,
        status: "draft",
        customer_id: reqBody.customer_id ?? null,
        collection_method: reqBody.collection_method ?? "automatic",
      });
    for (const item of reqBody.items) {
      ctx.db
        .query(
          `
          INSERT INTO paddle_transaction_item (
            transaction_id,
            price_id,
            quantity
          ) VALUES (  
            :transaction_id,
            :priceId,
            :quantity
          )
        `,
        )
        .run({
          transaction_id: id,
          priceId: item.price_id,
          quantity: item.quantity,
        });
    }
  });
  insertTransaction();

  const transaction = ctx.db
    .query<TransactionRow, sqlite.SQLQueryBindings>(
      "SELECT * FROM paddle_transaction WHERE id = :id",
    )
    .get({ id });

  if (transaction === null) {
    throw new Error("Unreachable");
  }

  return Response.json(
    {
      data: {
        id: transaction.id,
        status: transaction.status,
        customer_id: transaction.customer_id,
      },
    },
    { status: 201 },
  );
}
