import type * as sqlite from "bun:sqlite";
import { db } from "@util/index";
import * as paddle from "@util/paddle";

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string | null;
  collection_method: "automatic" | "manual";
  created_at: number;
  updated_at: number;
};

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes] = paddle.authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await req.json();

  const id = `txn_${paddle.generateId()}`;

  const insertTransaction = db.transaction(() => {
    db.query(
      `
        INSERT INTO paddle_transaction (
          id,
          status,
          customer_id,
          collection_method,
          created_at,
          updated_at
        ) VALUES (
          $id,
          $status,
          $customer_id,
          $collection_method,
          $created_at,
          $updated_at
        )
      `,
    ).run({
      id,
      status: "draft",
      customer_id: reqBody.customer_id ?? null,
      collection_method: reqBody.collection_method ?? "automatic",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
    for (const item of reqBody.items) {
      db.query(
        `
          INSERT INTO paddle_transaction_item (
            transaction_id,
            price_id,
            quantity
          ) VALUES (  
            $transactionId,
            $priceId,
            $quantity
          )
        `,
      ).run({
        transactionId: id,
        priceId: item.price_id,
        quantity: item.quantity,
      });
    }
  });
  insertTransaction();

  const transaction = db
    .query<TransactionRow, sqlite.SQLQueryBindings>(
      "SELECT * FROM paddle_transaction WHERE id = $id",
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
        created_at: new Date(transaction.created_at).toISOString(),
        updated_at: new Date(transaction.updated_at).toISOString(),
      },
    },
    { status: 201 },
  );
}
