import * as sqlite from "bun:sqlite";
import { db } from "@util/index";
import * as paddle from "@util/paddle.ts";
import * as s from "superstruct";

export async function handle(req: Request): Promise<Response> {
  const [errorRes, accountId] = paddle.getAccountId(req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const reqCustomer = await req.json();
  s.assert(reqCustomer, s.object({ email: s.string() }));

  const id = `ctm_${paddle.generateId()}`;

  try {
    db.query(
      `
        INSERT INTO paddle_customer (
          account_id, 
          id, 
          email
        )
        VALUES (
          $projectId, 
          $id, 
          $email
        )
      `,
    ).run({
      id,
      projectId: accountId,
      email: reqCustomer.email,
    });
  } catch (error) {
    if (error instanceof sqlite.SQLiteError) {
      if (
        error.message ===
        "UNIQUE constraint failed: paddle_customer.account_id, paddle_customer.email"
      ) {
        return Response.json(
          {
            error: {
              type: "request_error",
              code: "customer_already_exists",
              detail: `customer email conflicts with customer of id ${id}`,
              documentation_url:
                "https://developer.paddle.com/v1/errors/customers/customer_already_exists",
            },
          },
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }
    throw error;
  }

  return Response.json(
    {
      data: {
        id,
        email: reqCustomer.email,
        // status: "active",
        // custom_data: null,
        // name: null,
        // marketing_consent: false,
        // locale: "en",
        // created_at: "2025-07-28T13:45:15.62Z",
        // updated_at: "2025-07-28T13:45:15.62Z",
        // import_meta: null,
      },
    },
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
}
