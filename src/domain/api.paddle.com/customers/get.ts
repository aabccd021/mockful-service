import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type QueryOf, type ResponseBodyOf } from "@util/index";
import { authenticate } from "@util/paddle.ts";

type Path = openapi.paths["/customers"]["get"];

type Row = {
  id: string;
  account_id: string;
  email: string;
  status: "active" | "archived";
  name: string | null;
  marketing_consent: "true" | "false";
  locale: string;
  created_at: number;
  updated_at: number;
};

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(req.url).searchParams;

  // per_page=-1
  // {
  //   "error": {
  //     "type": "request_error",
  //     "code": "invalid_field",
  //     "detail": "Request does not pass validation.",
  //     "documentation_url": "https://developer.paddle.com/v1/errors/shared/invalid_field",
  //     "errors": [
  //       {
  //         "field": "TransactionsRequest.PerPage",
  //         "message": "must be greater than or equal to 0. Provided: -1"
  //       }
  //     ]
  //   },
  //   "meta": {
  //     "request_id": "984dfe76-35ce-4134-a222-39bac3d32a3e"
  //   }
  // }
  // per_page=1.5
  // {
  //   "error": {
  //     "type": "request_error",
  //     "code": "bad_request",
  //     "detail": "Invalid request.",
  //     "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
  //     "errors": [
  //       {
  //         "field": "per_page",
  //         "message": "invalid input"
  //       }
  //     ]
  //   },
  //   "meta": {
  //     "request_id": "d3c600de-5516-4b2c-8395-e94a96dc0fae"
  //   }
  // }
  //
  // status=ready,active
  // {
  //   "error": {
  //     "type": "request_error",
  //     "code": "invalid_field",
  //     "detail": "Request does not pass validation.",
  //     "documentation_url": "https://developer.paddle.com/v1/errors/shared/invalid_field",
  //     "errors": [
  //       {
  //         "field": "TransactionsRequest.Status[1]",
  //         "message": "must be one of the following values: paid|completed|ready|billed|draft|canceled|past_due. Provided: active"
  //       }
  //     ]
  //   },
  //   "meta": {
  //     "request_id": "398fb4a5-5eef-497e-818f-bc06b692d70d"
  //   }
  // }
  //
  // one of the ids is invalid
  // id=txn_01k0nddb19m718qq4bmfr0scc3,foo
  // {
  //   "error": {
  //     "type": "request_error",
  //     "code": "bad_request",
  //     "detail": "Invalid request.",
  //     "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
  //     "errors": [
  //       {
  //         "field": "id",
  //         "message": "invalid input"
  //       }
  //     ]
  //   },
  //   "meta": {
  //     "request_id": "0295bbce-5090-45ac-b75c-55814cc5aca5"
  //   }
  // }
  const reqQuery: QueryOf<Path> = {
    email: rawQuery.get("email")?.split(","),
    after: rawQuery.get("after") ?? undefined,
    id: rawQuery.get("id")?.split(","),
    order_by: rawQuery.get("order_by") ?? undefined,
    search: rawQuery.get("search") ?? undefined,
    // per_page: ...
    // status: ...
  };

  let customers = null;
  if (reqQuery.email !== undefined) {
    customers = reqQuery.email
      .map((email) =>
        db
          .query<Row, sqlite.SQLQueryBindings>(
            "SELECT * FROM paddle_customer WHERE email = $email AND account_id = $accountId",
          )
          .get({ email, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else if (reqQuery.id !== undefined) {
    customers = reqQuery.id
      .map((id) =>
        db
          .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_customer WHERE id = $id")
          .get({ id, accountId: authReq.accountId }),
      )
      .filter((val) => val !== null);
  } else {
    customers = db
      .query<Row, sqlite.SQLQueryBindings>(
        "SELECT * FROM paddle_customer WHERE account_id = $accountId",
      )
      .all({ accountId: authReq.accountId });
  }

  const data = customers.map((customer) => ({
    id: customer.id,
    account_id: customer.account_id,
    email: customer.email,
    status: customer.status,
    name: customer.name,
    locale: customer.locale,
    marketing_consent: customer.marketing_consent === "true",
    created_at: new Date(customer.created_at).toISOString(),
    updated_at: new Date(customer.updated_at).toISOString(),
    custom_data: null,
    import_meta: null,
  }));

  const resBody: ResponseBodyOf<Path, 200> = {
    data,
    meta: {
      request_id: authReq.id,
      pagination: {
        has_more: false,
        per_page: data.length,
        next: "",
      },
    },
  };

  return Response.json(resBody, { status: 200 });
}
