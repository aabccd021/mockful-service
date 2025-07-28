import { assert, nullable, object, string } from "superstruct";
import { generateId, getTenantId } from "./paddle-util";
import type { Context } from "./util";

const Customer = nullable(
  object({
    tenant_id: string(),
    id: string(),
    email: string(),
  }),
);

async function get(
  req: Request,
  ctx: Context,
  tenantId: string,
): Promise<Response> {
  const url = new URL(req.url);
  const emails = url.searchParams.get("email")?.split(",") ?? [];

  const customers = emails
    .map((email) => {
      const customer = ctx.db
        .query(
          "SELECT * FROM paddle_customer WHERE email = $email AND tenant_id = $tenantId",
        )
        .get({ email, tenantId });
      assert(customer, Customer);
      return customer;
    })
    .filter((c) => c !== null)
    .map(({ tenant_id: _, ...data }) => data);

  return new Response(JSON.stringify({ data: customers }), {
    status: 200,
  });
}

async function post(
  req: Request,
  ctx: Context,
  tenantId: string,
): Promise<Response> {
  const reqCustomer = await req.json();
  assert(
    reqCustomer,
    object({
      email: string(),
    }),
  );

  const id = `ctm_${generateId()}`;

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
      tenantId,
      id,
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

export async function handle(req: Request, ctx: Context): Promise<Response> {
  const tenantId = getTenantId(req, ctx);
  if (tenantId.type === "response") {
    return tenantId.response;
  }

  if (req.method === "POST") {
    return post(req, ctx, tenantId.value);
  }

  if (req.method === "GET") {
    return get(req, ctx, tenantId.value);
  }

  return new Response("Method Not Allowed", { status: 405 });
}
