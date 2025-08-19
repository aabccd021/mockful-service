import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type ResponseBodyOf } from "@util/index";
import { authenticate } from "@util/paddle.ts";

type Path = openapi.paths["/customers"]["get"];

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

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(req.url).searchParams;

  const query = {
    email: rawQuery.get("email")?.split(","),
    after: rawQuery.get("after") ?? undefined,
    id: rawQuery.get("id")?.split(","),
    order_by: rawQuery.get("order_by") ?? undefined,
    search: rawQuery.get("search") ?? undefined,
  };

  let customers = null;
  if (query.email !== undefined) {
    customers = query.email
      .map((email) =>
        db
          .query<Row, sqlite.SQLQueryBindings>(
            "SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId",
          )
          .get({ email, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else if (query.id !== undefined) {
    customers = query.id
      .map((id) =>
        db
          .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_customer WHERE id = $id")
          .get({ id, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else {
    customers = db
      .query<Row, sqlite.SQLQueryBindings>(
        "SELECT * FROM paddle_customer WHERE account_id = $accountId",
      )
      .all({ accountId: authReq.accountId });
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
