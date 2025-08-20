import * as sqlite from "bun:sqlite";
import type { Context } from "@util/index.ts";
import * as paddle from "@util/paddle";

type Row = {
  id: string;
  account_id: string;
  email: string;
  status: "active" | "archived";
  name: string | null;
  marketing_consent: "true" | "false";
  locale: string;
  created_at: number;
  updated_at: number;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, accountId] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await ctx.req.json();

  const id = `ctm_${paddle.generateId()}`;

  try {
    ctx.db
      .query(
        `
        INSERT INTO paddle_customer (
          account_id, 
          id, 
          email,
          locale,
          created_at,
          updated_at
        )
        VALUES (
          $accountId, 
          $id, 
          $email,
          $locale,
          $createdAt,
          $updatedAt
        )
      `,
      )
      .run({
        id,
        accountId: accountId,
        email: reqBody.email,
        locale: reqBody.locale ?? "en",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
  } catch (err) {
    if (
      err instanceof sqlite.SQLiteError &&
      err.message === "UNIQUE constraint failed: paddle_customer.account_id, paddle_customer.email"
    ) {
      const resBody = {
        error: {
          type: "request_error",
          code: "customer_already_exists",
          detail: `customer email conflicts with customer of id ${id}`,
          documentation_url:
            "https://developer.paddle.com/v1/errors/customers/customer_already_exists",
        },
      };
      return Response.json(resBody, { status: 409 });
    }

    throw err;
  }

  const customer = ctx.db
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_customer WHERE id = $id")
    .get({ id });

  if (customer === null) {
    throw new Error("Unreachable");
  }

  return Response.json(
    {
      data: {
        id: customer.id,
        email: customer.email,
        status: customer.status,
        name: customer.name,
        marketing_consent: customer.marketing_consent === "true",
        created_at: new Date(customer.created_at).toISOString(),
        updated_at: new Date(customer.updated_at).toISOString(),
        locale: customer.locale,
      },
    },
    { status: 201 },
  );
}
