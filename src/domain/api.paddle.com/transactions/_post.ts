import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type ResponseBodyOf } from "@util/index";
import { authenticate, generateId, getBody, invalidRequest } from "@util/paddle";

type Path = openapi.paths["/transactions"]["post"];

type TransactionRow = {
  id: string;
  status: "draft" | "ready" | "billed" | "paid" | "completed" | "canceled" | "past_due";
  customer_id: string | null;
  collection_method: "automatic" | "manual";
  created_at: number;
  updated_at: number;
};

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const [errorRes, reqBody] = await getBody(authReq, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const id = `txn_${generateId()}`;

  const items = reqBody.items;
  if (!Array.isArray(items)) {
    return invalidRequest(authReq, [
      {
        field: "items",
        message: "The items field must be an array.",
      },
    ]);
  }

  if (items.length === 0) {
    return invalidRequest(authReq, [
      {
        field: "items",
        message: "Array must have at least one item",
      },
    ]);
  }

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
    for (const item of items) {
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

  const data: Pick<
    ResponseBodyOf<Path, 201>["data"],
    "id" | "status" | "customer_id" | "created_at" | "updated_at"
  > = {
    id: transaction.id,
    status: transaction.status,
    customer_id: transaction.customer_id,
    created_at: new Date(transaction.created_at).toISOString(),
    updated_at: new Date(transaction.updated_at).toISOString(),
  };

  const resBody = {
    data,
    meta: {
      request_id: authReq.id,
    },
  };

  return Response.json(resBody, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
