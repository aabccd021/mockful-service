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

function getCustomers(ctx: Context, tenantId: string): unknown[] {
  const url = new URL(ctx.req.url);

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

export async function handle(ctx: Context): Promise<Response> {
  const tenantId = getTenantId(ctx);
  if (tenantId.type === "response") {
    return tenantId.response;
  }
  const customers = getCustomers(ctx, tenantId.value)
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
