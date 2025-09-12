import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

type Row = {
  id: string;
  account_id: string;
  email: string;
  status: "active" | "archived";
  name: string | null;
  marketing_consent: "true" | "false";
  locale: string;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(ctx.req.url).searchParams;

  const reqQuery = {
    email: rawQuery.get("email")?.split(",") ?? [null],
    id: rawQuery.get("id")?.split(",") ?? [null],
  };

  // TODO test this
  // foo_email => foo_email
  // bar_email => bar_email
  // foo_email + bar_email => foo_email,bar_email
  // foo_id => foo_email
  // foo_id & foo_email => foo_email
  // foo_id & bar_email =>
  // foo_id & foo_email + bar_email => foo_email
  // bar_id => bar_email
  // bar_id & foo_email =>
  // bar_id & bar_email => bar_email
  // bar_id & foo_email + bar_email => bar_email
  // foo_id + bar_id => foo_email,bar_email
  // foo_id + bar_id & foo_email => foo_email
  // foo_id + bar_id & bar_email => bar_email
  // foo_id + bar_id & foo_email + bar_email => foo_email,bar_email

  const argCombinations = reqQuery.email.flatMap((email) =>
    reqQuery.id.map((id) => ({ email, id })),
  );

  const customers = argCombinations.flatMap(({ email, id }) => {
    return ctx.db
      .query<Row, sqlite.SQLQueryBindings>(`
        SELECT * FROM paddle_customer 
        WHERE account_id = :account_id
        AND (:email IS NULL OR email = :email)
        AND (:id IS NULL OR id = :id)
      `)
      .all({ account_id: account.id, email, id });
  });

  const data = customers.map((customer) => ({
    id: customer.id,
    account_id: customer.account_id,
    email: customer.email,
    status: customer.status,
    name: customer.name,
    locale: customer.locale,
    marketing_consent: customer.marketing_consent === "true",
  }));

  return Response.json({ data }, { status: 200 });
}
