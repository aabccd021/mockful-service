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
    id: rawQuery.get("id")?.split(","),
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
    description: product.description ?? null,
    type: product.type ?? "standard",
    tax_category: product.tax_category,
    image_url: product.image_url ?? null,
    custom_data: null,
    status: product.status,
    import_meta: null,
    created_at: new Date(product.created_at).toISOString(),
    updated_at: new Date(product.updated_at).toISOString(),
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
