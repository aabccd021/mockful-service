import { db } from "@util/index.ts";
import { getAccountId } from "@util/paddle.ts";
import * as s from "superstruct";

function getCustomers(req: Request, accountId: string): unknown[] {
  const url = new URL(req.url);

  const emails = url.searchParams.get("email")?.split(",");
  if (emails !== undefined) {
    return emails
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
  const [errorRes, accountId] = getAccountId(req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const customers_ = getCustomers(req, accountId);

  const customers = customers_
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

  return Response.json(
    { data: customers },
    {
      status: 200,
    },
  );
}
