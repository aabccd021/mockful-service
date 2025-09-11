import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

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
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(ctx.req.url).searchParams;

  const reqQuery = {
    // after: rawQuery.get("after") ?? undefined,
    // order_by: rawQuery.get("order_by") ?? undefined,
    id: rawQuery.get("id")?.split(","),
  };

  const argCombinations = (reqQuery.id ?? [null]).map((id) => ({ id }));

  const products = argCombinations.flatMap(({ id }) => {
    return ctx.db
      .query<Row, sqlite.SQLQueryBindings>(
        `
        SELECT * FROM paddle_product 
        WHERE account_id = :account_id
        AND (:id IS NULL OR id = :id)
        AND status = 'active'
      `,
      )
      .all({ account_id: account.id, id });
  });

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    tax_category: product.tax_category,
    image_url: product.image_url,
    status: product.status,
  }));

  return Response.json({ data }, { status: 200 });
}
