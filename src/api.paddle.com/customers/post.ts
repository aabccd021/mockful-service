import * as sqlite from "bun:sqlite";
import * as paddle from "@paddle/util.ts";
import type { Context } from "@util";

type Row = {
  id: string;
  account_id: string;
  email: string;
  status: "active" | "archived";
  marketing_consent: "true" | "false";
  locale: string;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
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
          locale
        )
        VALUES (
          $account_id, 
          $id, 
          :email,
          :locale
        )
      `,
      )
      .run({
        id,
        account_id: account.id,
        email: reqBody.email,
        locale: reqBody.locale ?? "en",
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
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_customer WHERE id = :id")
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
        marketing_consent: customer.marketing_consent === "true",
        locale: customer.locale,
      },
    },
    { status: 201 },
  );
}
