import { db } from "@util/index.ts";
import { getAccountId } from "@util/paddle.ts";
import * as s from "superstruct";

const Customer = s.object({
  account_id: s.string(),
  id: s.string(),
  email: s.string(),
});

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

  const customers = getCustomers(req, accountId)
    .filter((val) => s.is(val, Customer))
    .map(({ account_id: _, ...data }) => data);

  return Response.json(
    { data: customers },
    {
      status: 200,
    },
  );
}
