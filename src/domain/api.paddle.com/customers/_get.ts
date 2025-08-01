import type * as openapi from "@openapi/paddle.ts";
import { db, type QueryOf, type ResponseBodyOf } from "@util/index";
import { authenticate } from "@util/paddle.ts";

type Path = openapi.paths["/customers"]["get"];

type Customer = {
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
  const [errorRes, authReq] = authenticate(req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const rawQuery = new URL(req.url).searchParams;

  const reqQuery: QueryOf<Path> = {
    after: rawQuery.get("after") ?? undefined,
    email: rawQuery.get("email")?.split(","),
    id: rawQuery.get("id")?.split(","),
    order_by: rawQuery.get("order_by") ?? undefined,
    per_page: Number.parseInt(rawQuery.get("per_page") ?? "50", 10),
    search: rawQuery.get("search") ?? undefined,
    // {
    //   "field": "Status[0]",
    //   "message": "Key: 'FetchAllCustomers.Status[0]' Error:Field validation for 'Status[0]' failed on the 'oneof' tag"
    // }
    // status: rawQuery.get("status")?.split(",") ?? undefined,
  };

  let customers = null;
  if (reqQuery.email !== undefined) {
    customers = reqQuery.email
      .map((email) =>
        db
          .query<Customer, { email: string; accountId: string }>(
            "SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId",
          )
          .get({ email, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else {
    customers = db
      .query<Customer, { accountId: string }>(
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
