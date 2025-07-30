import type { Context } from "@util/index.ts";
import * as paddle from "@util/paddle.ts";
import { assert, object, string } from "superstruct";

export async function handle(req: Request, ctx: Context): Promise<Response> {
  const tenantId = paddle.getTenantId(req, ctx);
  if (tenantId.type === "response") {
    return tenantId.response;
  }

  const reqCustomer = await req.json();
  assert(
    reqCustomer,
    object({
      email: string(),
    }),
  );

  const id = `ctm_${paddle.generateId()}`;

  ctx.db
    .query(
      `
        INSERT INTO paddle_customer (
          tenant_id, 
          id, 
          email
        )
        VALUES (
          $tenantId, 
          $id, 
          $email
        )
      `,
    )
    .run({
      id,
      tenantId: tenantId.value,
      email: reqCustomer.email,
    });

  // if already exists
  // 409
  // {
  //   "error": {
  //     "type": "request_error",
  //     "code": "customer_already_exists",
  //     "detail": "customer email conflicts with customer of id ctm_01k0n2kbzv453bjq45vmgky38m",
  //     "documentation_url": "https://developer.paddle.com/v1/errors/customers/customer_already_exists"
  //   },
  //   "meta": {
  //     "request_id": "8bc3d138-4d61-435a-bdf1-0b49555a3b60"
  //   }
  // }

  return new Response(
    JSON.stringify({
      data: {
        id,
        // status: "active",
        // custom_data: null,
        // name: null,
        // email: reqCustomer.email,
        // marketing_consent: false,
        // locale: "en",
        // created_at: "2025-07-28T13:45:15.62Z",
        // updated_at: "2025-07-28T13:45:15.62Z",
        // import_meta: null,
      },
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
}
