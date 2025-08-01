import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type QueryOf, type ResponseBodyOf } from "@util/index";
import { authenticate } from "@util/paddle.ts";

type Path = openapi.paths["/products"]["get"];

type Product = {
  id: string;
  account_id: string;
  name: string;
  description: string | null;
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
  custom_data: null;
  status: "active" | "archived";
  created_at: number;
  updated_at: number;
};

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(req.url).searchParams;

  const reqQuery: QueryOf<Path> = {
    after: rawQuery.get("after") ?? undefined,
    id: rawQuery.get("id")?.split(","),
    // include: rawQuery.get("include")?.split(","),
    order_by: rawQuery.get("order_by") ?? undefined,
    // per_page: rawQuery.get("per_page") ?? undefined,
    // status: rawQuery.get("status") ?? undefined,
    // tax_category: rawQuery.get("tax_category") ?? undefined,
    // type: rawQuery.get("type") ?? undefined,
  };

  let products = null;
  if (reqQuery.id !== undefined) {
    products = reqQuery.id
      .map((id) =>
        db
          .query<Product, sqlite.SQLQueryBindings>("SELECT * FROM paddle_product WHERE id = $id")
          .get({ id, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else {
    products = db
      .query<Product, sqlite.SQLQueryBindings>(
        "SELECT * FROM paddle_product WHERE account_id = $accountId",
      )
      .all({ accountId: authReq.accountId });
  }

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    tax_category: product.tax_category,
    image_url: product.image_url,
    status: product.status,
    created_at: new Date(product.created_at).toISOString(),
    updated_at: new Date(product.updated_at).toISOString(),
    custom_data: null,
    import_meta: null,
  }));

  const resBody: ResponseBodyOf<Path, 200> = {
    data,
    meta: {
      request_id: authReq.id,
      pagination: {
        has_more: false,
        per_page: data.length,
        next: "",
      },
    },
  };

  return Response.json(resBody, { status: 200 });
}
