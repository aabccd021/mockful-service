import * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import {
  type DefaultError,
  generateId,
  getAccountId,
  getBody,
  invalidRequest,
  invalidType,
  requiredField,
} from "@util/paddle";

type Path = openapi.paths["/customers"]["post"];

export async function handle(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();

  const [errorRes, rawBody] = await getBody(requestId, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const [emailError, reqEmail] = !("email" in rawBody)
    ? [requiredField("(root)", "email")]
    : typeof rawBody.email !== "string"
      ? [invalidType(rawBody, "email", "string")]
      : [undefined, rawBody.email];

  const [nameError, reqName] = !("name" in rawBody)
    ? [undefined, undefined]
    : typeof rawBody.name !== "string"
      ? [invalidType(rawBody, "name", "string")]
      : [undefined, rawBody.name];

  const [localeError, reqLocale] = !("locale" in rawBody)
    ? [undefined, undefined]
    : typeof rawBody.locale !== "string"
      ? [invalidType(rawBody, "locale", "string")]
      : [undefined, rawBody.locale];

  if (emailError !== undefined || nameError !== undefined || localeError !== undefined) {
    const errors = [emailError, nameError].filter((err) => err !== undefined);
    return invalidRequest(requestId, errors);
  }

  const reqBody: RequestBodyOf<Path> = {
    email: reqEmail,
    name: reqName,
    locale: reqLocale,
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
          locale,
          created_at,
          updated_at
        )
        VALUES (
          $projectId, 
          $id, 
          $email,
          COALESCE($locale, 'en'),
          $createdAt,
          $updatedAt
        )
      `,
    ).run({
      id,
      projectId: accountId,
      email: reqBody.email,
      locale: reqBody.locale ?? null,
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
