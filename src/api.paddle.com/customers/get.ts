import type * as sqlite from "bun:sqlite";
import * as paddle from "@paddle/util.ts";
import type { Context } from "@util";

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
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(ctx.req.url).searchParams;

  const reqQuery = {
    email: rawQuery.get("email")?.split(","),
    id: rawQuery.get("id")?.split(","),
  };

  let customers = null;
  if (reqQuery.email !== undefined) {
    customers = reqQuery.email
      .map((email) =>
        ctx.db
          .query<Row, sqlite.SQLQueryBindings>(
            "SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId",
          )
          .get({ email, accountId: account.id }),
      )
      .filter((val) => val !== null);
  } else if (reqQuery.id !== undefined) {
    customers = reqQuery.id
      .map((id) =>
        ctx.db
          .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_customer WHERE id = $id")
          .get({ id, accountId: account.id }),
      )
      .filter((val) => val !== null);
  } else {
    customers = ctx.db
      .query<Row, sqlite.SQLQueryBindings>(
        "SELECT * FROM paddle_customer WHERE account_id = $accountId",
      )
      .all({ accountId: account.id });
  }

  const data = customers.map((customer) => ({
    id: customer.id,
    account_id: customer.account_id,
    email: customer.email,
    status: customer.status,
    name: customer.name,
    locale: customer.locale,
    marketing_consent: customer.marketing_consent === "true",
    created_at: new Date(customer.created_at).toISOString(),
    updated_at: new Date(customer.updated_at).toISOString(),
  }));

  return Response.json({ data }, { status: 200 });
}
