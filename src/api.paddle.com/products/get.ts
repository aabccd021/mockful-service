import type * as sqlite from "bun:sqlite";
import * as paddle from "@paddle/util.ts";
import type { Context } from "@util";

type Row = {
  id: string;
  account_id: string;
  name: string;
  type: "standard" | "custom";
  tax_category:
    | "digital-goods"
    | "ebooks"
    | "implementation-services"
    | "professional-services"
    | "saas"
    | "software-programming-services"
    | "standard"
    | "training-services"
    | "website-hosting";
  image_url: string | null;
  status: "active" | "archived";
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
    after: rawQuery.get("after") ?? undefined,
    id: rawQuery.get("id")?.split(","),
    order_by: rawQuery.get("order_by") ?? undefined,
  };

  let products = null;
  if (reqQuery.id !== undefined) {
    products = reqQuery.id
      .map((id) =>
        ctx.db
          .query<Row, sqlite.SQLQueryBindings>(
            "SELECT * FROM paddle_product WHERE id = $id AND status = 'active'",
          )
          .get({ id, accountId: account.id }),
      )
      .filter((val) => val !== null);
  } else {
    products = ctx.db
      .query<Row, sqlite.SQLQueryBindings>(
        "SELECT * FROM paddle_product WHERE account_id = $accountId AND status = 'active'",
      )
      .all({ accountId: account.id });
  }

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    tax_category: product.tax_category,
    image_url: product.image_url,
    status: product.status,
    created_at: new Date(product.created_at).toISOString(),
    updated_at: new Date(product.updated_at).toISOString(),
  }));

  return Response.json({ data }, { status: 200 });
}
