import type { Context } from "@util/index.ts";
import { is, nullable, object, string } from "superstruct";
import { getTenantId } from "../../../util/paddle";

const Customer = nullable(
  object({
    tenant_id: string(),
    id: string(),
    email: string(),
  }),
);

function getCustomers(ctx: Context, req: Request, tenantId: string): unknown[] {
  const url = new URL(req.url);

  const emails = url.searchParams.get("email")?.split(",");
  if (emails !== undefined) {
    return emails.map((email) => {
      return ctx.db
        .query("SELECT * FROM paddle_customer WHERE email = $email AND tenant_id = $tenantId")
        .get({ email, tenantId });
    });
  }

  return ctx.db
    .query("SELECT * FROM paddle_customer WHERE tenant_id = $tenantId")
    .all({ tenantId });
}

export async function handle(req: Request, ctx: Context): Promise<Response> {
  const tenantId = getTenantId(req, ctx);
  if (tenantId.type === "response") {
    return tenantId.response;
  }
  const customers = getCustomers(ctx, req, tenantId.value)
    .filter((val) => is(val, Customer))
    .filter((val) => val !== null)
    .map(({ tenant_id: _, ...data }) => data);

  return Response.json(
    { data: customers },
    {
      status: 200,
    },
  );
}
