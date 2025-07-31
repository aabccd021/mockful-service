import * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import * as paddle from "@util/paddle.ts";
import * as s from "superstruct";

type Path = openapi.paths["/customers"]["post"];

async function validateRequest(req: Request): Promise<RequestBodyOf<Path>> {
  const body = await req.json();
  s.assert(body, s.object({ email: s.string() }));
  return body;
}

export async function handle(req: Request): Promise<Response> {
  const reqCustomer = await validateRequest(req);

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
          email
        )
        VALUES (
          $projectId, 
          $id, 
          $email
        )
      `,
    ).run({
      id,
      projectId: accountId,
      email: reqCustomer.email,
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

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      email: reqCustomer.email,
      id,
      status: "active",
      custom_data: null,
      name: null,
      marketing_consent: false,
      locale: "en",
      created_at: "2025-07-28T13:45:15.62Z",
      updated_at: "2025-07-28T13:45:15.62Z",
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
