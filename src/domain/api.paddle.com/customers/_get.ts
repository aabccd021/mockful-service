import { db } from "@util/index.ts";
import { getAccountId } from "@util/paddle.ts";
import * as v from "valibot";

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
  const accountId = getAccountId(req);
  if (accountId.type === "response") {
    return accountId.response;
  }
  const customers = getCustomers(req, accountId.value);
  v.assert(
    v.array(
      v.object({
        account_id: v.string(),
        id: v.string(),
        email: v.string(),
      }),
    ),
    customers,
  );

  return Response.json(
    { data: customers },
    {
      status: 200,
    },
  );
}
