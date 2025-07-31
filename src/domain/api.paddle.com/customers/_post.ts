import * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import * as paddle from "@util/paddle.ts";
import * as s from "superstruct";

type Path = openapi.paths["/customers"]["post"];

export async function handle(req: Request): Promise<Response> {
  const rawBody = await req.json();
  s.assert(rawBody, s.object({ email: s.string() }));
  const reqBody: RequestBodyOf<Path> = rawBody;

  const [errorRes, accountId] = paddle.getAccountId(req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const requestId = crypto.randomUUID();

  const id = `ctm_${paddle.generateId()}`;

  try {
    db.query(
      `
        INSERT INTO paddle_customer (
          account_id, 
          id, 
          email,
          created_at,
          updated_at
        )
        VALUES (
          $projectId, 
          $id, 
          $email,
          $createdAt,
          $updatedAt
        )
      `,
    ).run({
      id,
      projectId: accountId,
      email: reqBody.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    if (error instanceof sqlite.SQLiteError) {
      if (
        error.message ===
        "UNIQUE constraint failed: paddle_customer.account_id, paddle_customer.email"
      ) {
        const resBody: ResponseBodyOf<Path, "default"> = {
          error: {
            type: "request_error",
            code: "customer_already_exists",
            detail: `customer email conflicts with customer of id ${id}`,
            documentation_url:
              "https://developer.paddle.com/v1/errors/customers/customer_already_exists",
          },
          meta: {
            request_id: requestId,
          },
        };
        return Response.json(resBody, {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    throw error;
  }

  const customer = db.query("SELECT * FROM paddle_customer WHERE id = $id").get({ id });
  s.assert(
    customer,
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
  );

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      ...customer,
      marketing_consent: customer.marketing_consent === "true",
      created_at: new Date(customer.created_at).toISOString(),
      updated_at: new Date(customer.updated_at).toISOString(),
      custom_data: null,
      import_meta: null,
    },
    meta: {
      request_id: requestId,
    },
  };

  return Response.json(resBody, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
