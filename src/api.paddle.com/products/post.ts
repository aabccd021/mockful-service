import type * as sqlite from "bun:sqlite";
import * as paddle from "@paddle/util.ts";
import type { Context } from "@util";

type Row = {
  id: string;
  account_id: string;
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
  created_at: number;
  updated_at: number;
  name: string;
  type: "standard" | "custom";
  image_url?: string;
  status: "active" | "archived";
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await ctx.req.json();

  const enabledCategory = ctx.db
    .query(
      `
        SELECT * 
        FROM paddle_account_tax_category_enabled 
        WHERE account_id = $account_id 
        AND tax_category = :tax_category
      `,
    )
    .get({
      account_id: account.id,
      tax_category: reqBody.tax_category,
    });

  if (enabledCategory === null) {
    return Response.json(
      {
        error: {
          type: "request_error",
          code: "product_tax_category_not_approved",
          detail: "tax category not approved",
          documentation_url:
            "https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved",
        },
      },
      { status: 400 },
    );
  }

  const id = `pro_${paddle.generateId()}`;

  // try {
  ctx.db
    .query(
      `
      INSERT INTO paddle_product (
        account_id, 
        id, 
        name,
        tax_category,
        type,
        image_url,
        created_at,
        updated_at
      )
      VALUES (
        $account_id, 
        $id, 
        :name,
        :tax_category,
        :type,
        :image_url,
        :created_at,
        :updated_at
      )
    `,
    )
    .run({
      account_id: account.id,
      id,
      name: reqBody.name,
      tax_category: reqBody.tax_category,
      type: reqBody.type ?? "standard",
      image_url: reqBody.image_url ?? null,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

  const product = ctx.db
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_product WHERE id = :id")
    .get({ id });

  if (product === null) {
    throw new Error("Unreachable");
  }

  return Response.json(
    {
      data: {
        id: product.id,
        tax_category: product.tax_category,
        created_at: new Date(product.created_at).toISOString(),
        updated_at: new Date(product.updated_at).toISOString(),
        name: product.name,
        type: product.type,
        image_url: product.image_url ?? null,
        status: product.status,
      },
    },
    { status: 201 },
  );
}
