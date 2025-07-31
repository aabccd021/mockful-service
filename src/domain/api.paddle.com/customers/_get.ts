import type * as openapi from "@openapi/paddle.ts";
import { db, type QueryOf, type ResponseBodyOf } from "@util/index";
import { getAccountId } from "@util/paddle.ts";
import * as s from "superstruct";

type Path = openapi.paths["/customers"]["get"];

type Query = QueryOf<Path>;

function getCustomers(query: Query, accountId: string): unknown[] {
  if (query.email !== undefined) {
    return query.email
      .map((email) =>
        db
          .query("SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId")
          .get({ email, accountId }),
      )
      .filter((val) => val !== null);
  }

  return db.query("SELECT * FROM paddle_customer WHERE account_id = $accountId").all({ accountId });
}

export async function handle(req: Request): Promise<Response> {
  const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
  s.assert(
    rawQuery,
    s.object({
      email: s.optional(s.string()),
    }),
  );

  const query: Query = {
    email: rawQuery.email?.split(","),
  };

  const [errorRes, accountId] = getAccountId(req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const requestId = crypto.randomUUID();

  const customers = getCustomers(query, accountId)
    .filter((val) =>
      s.is(
        val,
        s.object({
          id: s.string(),
          account_id: s.string(),
          email: s.string(),
          status: s.enums(["active", "archived"]),
          name: s.nullable(s.string()),
          marketing_consent: s.enums(["true", "false"]),
          locale: s.string(),
          created_at: s.number(),
          updated_at: s.number(),
        }),
      ),
    )
    .map(({ account_id: _, ...customer }) => ({
      ...customer,
      marketing_consent: customer.marketing_consent === "true",
      created_at: new Date(customer.created_at).toISOString(),
      updated_at: new Date(customer.updated_at).toISOString(),
      custom_data: null,
      import_meta: null,
    }));

  const resBody: ResponseBodyOf<Path, 200> = {
    data: customers,
    meta: {
      request_id: requestId,
      pagination: {
        has_more: false,
        per_page: customers.length,
        next: "",
      },
    },
  };

  return Response.json(resBody, { status: 200 });
}
