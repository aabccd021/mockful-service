import * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import {
  type DefaultError,
  type FieldValidation,
  generateId,
  getAccountId,
  getRawBody,
  invalidRequest,
} from "@util/paddle";

type Path = openapi.paths["/customers"]["post"];

export async function handle(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  const [errorRes, rawBody] = await getRawBody(requestId, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const [emailError, reqEmail]: FieldValidation = !("email" in rawBody)
    ? [
        {
          field: "(root)",
          message: "email is required",
        },
      ]
    : typeof rawBody.email !== "string"
      ? [
          {
            field: "email",
            message: `Invalid type. Expected string, received '${typeof rawBody.email}'`,
          },
        ]
      : [undefined, rawBody.email];

  if (emailError !== undefined) {
    return invalidRequest(requestId, [emailError]);
  }

  const reqBody: RequestBodyOf<Path> = {
    email: reqEmail,
  };

  const [errorRes2, accountId] = getAccountId(req);
  if (errorRes2 !== undefined) {
    return errorRes2;
  }

  const id = `ctm_${generateId()}`;

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
        const resBody: DefaultError = {
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
    throw new Error("Unreachable", { cause: error });
  }

  const customer = db
    .query<
      {
        id: string;
        account_id: string;
        email: string;
        status: "active" | "archived";
        name: string | null;
        marketing_consent: "true" | "false";
        locale: string;
        created_at: number;
        updated_at: number;
      },
      { id: string }
    >("SELECT * FROM paddle_customer WHERE id = $id")
    .get({ id });

  if (customer === null) {
    throw new Error("Unreachable");
  }

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      id: customer.id,
      email: customer.email,
      status: customer.status,
      name: customer.name,
      marketing_consent: customer.marketing_consent === "true",
      created_at: new Date(customer.created_at).toISOString(),
      updated_at: new Date(customer.updated_at).toISOString(),
      locale: customer.locale,
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
