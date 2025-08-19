import type * as sqlite from "bun:sqlite";
import type { paths } from "@openapi/paddle.ts";
import { db, type ResponseOf } from "@util/index";
import { authenticate, generateId, getBody } from "@util/paddle";

type Path = paths["/products"]["post"];

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
  description?: string;
  type: "standard" | "custom";
  image_url?: string;
  status: "active" | "archived";
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

  const enabledCategory = db
    .query(
      `
        SELECT * 
        FROM paddle_account_tax_category_enabled 
        WHERE account_id = $accountId 
        AND tax_category = $taxCategory
      `,
    )
    .get({
      accountId: authReq.accountId,
      taxCategory: reqBody.tax_category,
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
        meta: {
          request_id: authReq.id,
        },
      },
      { status: 400 },
    );
  }

  const id = `pro_${generateId()}`;

  // try {
  db.query(
    `
      INSERT INTO paddle_product (
        account_id, 
        id, 
        name,
        tax_category,
        description,
        type,
        image_url,
        created_at,
        updated_at
      )
      VALUES (
        $accountId, 
        $id, 
        $name,
        $taxCategory,
        $description,
        $type,
        $imageUrl,
        $createdAt,
        $updatedAt
      )
    `,
  ).run({
    accountId: authReq.accountId,
    id,
    name: reqBody.name,
    taxCategory: reqBody.tax_category,
    description: reqBody.description ?? null,
    type: reqBody.type ?? "standard",
    imageUrl: reqBody.image_url ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  // } catch (err) {
  // const errRes = mapConstraint(authReq, err, {
  //   paddle_price_unit_price_amount_not_negative: {
  //     field: "unit_price.amount",
  //     message: "The amount cannot be negative",
  //   },
  // });
  // if (errRes !== undefined) {
  //   return errRes;
  // }
  //   throw err;
  // }

  const product = db
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_product WHERE id = $id")
    .get({ id });

  if (product === null) {
    throw new Error("Unreachable");
  }

  const response: ResponseOf<Path, 201> = [
    {
      data: {
        id: product.id,
        tax_category: product.tax_category,
        created_at: new Date(product.created_at).toISOString(),
        updated_at: new Date(product.updated_at).toISOString(),
        name: product.name,
        description: product.description ?? null,
        type: product.type,
        image_url: product.image_url ?? null,
        custom_data: null,
        status: product.status,
        import_meta: null,
      },
      meta: {
        request_id: authReq.id,
      },
    },
    {
      status: 201,
    },
  ];

  return Response.json(...response);
}
