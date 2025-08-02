// status: 400
// {
//   "error": {
//     "type": "request_error",
//     "code": "bad_request",
//     "detail": "Invalid request.",
//     "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
//     "errors": [
//       {
//         "field": "quantity.minimum",
//         "message": "Must be greater than or equal to 1"
//       }
//     ]
//   },
//   "meta": {
//     "request_id": "0cd1fc4e-1216-4148-aa81-afb5376883a7"
//   }
// }
// status: 400, max < min
// {
//   "error": {
//     "type": "request_error",
//     "code": "bad_request",
//     "detail": "Invalid request.",
//     "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
//     "errors": [
//       {
//         "field": "quantity",
//         "message": "Invalid request."
//       }
//     ]
//   },
//   "meta": {
//     "request_id": "4d817483-1533-46c2-9d1f-43ce78d1b7e3"
//   }
// }

import type * as sqlite from "bun:sqlite";
import { SQLiteError } from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type ResponseBodyOf } from "@util/index";
import { authenticate, generateId, getBody, invalidRequest, mapConstraint } from "@util/paddle";

type Path = openapi.paths["/prices"]["post"];

type CurrencyCode = openapi.components["schemas"]["currency_code"];

type Interval = openapi.components["schemas"]["duration"]["interval"];

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const [errorRes, reqBody] = await getBody(authReq, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const id = `pri_${generateId()}`;

  try {
    db.query(
      `
      INSERT INTO paddle_price (
        id,
        description,
        product_id,
        unit_price_amount,
        unit_price_currency_code,
        type,
        name,
        billing_cycle_frequency,
        billing_cycle_interval,
        tax_mode,
        created_at,
        updated_at
      )
      VALUES (
        $id,
        $description,
        $productId,
        $unitPriceAmount,
        $unitPriceCurrencyCode,
        $type,
        $name,
        $billingCycleFrequency,
        $billingCycleInterval,
        $taxMode,
        $createdAt,
        $updatedAt
      )
    `,
    ).run({
      id,
      description: reqBody.description,
      productId: reqBody.product_id,
      unitPriceAmount: reqBody.unit_price.amount,
      unitPriceCurrencyCode: reqBody.unit_price.currency_code,
      type: reqBody.type ?? "standard",
      name: reqBody.name ?? null,
      billingCycleFrequency: reqBody.billing_cycle?.frequency ?? null,
      billingCycleInterval: reqBody.billing_cycle?.interval ?? null,
      taxMode: reqBody.tax_mode ?? "account_setting",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (err) {
    const errRes = mapConstraint(authReq, err, {
      paddle_price_unit_price_amount_not_negative: {
        field: "unit_price.amount",
        message: "The amount cannot be negative",
      },
    });
    if (errRes !== undefined) {
      return errRes;
    }
    if (
      err instanceof SQLiteError &&
      err.message === "cannot store REAL value in INTEGER column paddle_price.unit_price_amount"
    ) {
      return invalidRequest(authReq, [
        {
          field: "unit_price.amount",
          message: "The amount value is not a valid integer",
        },
      ]);
    }
    throw err;
  }

  const product = db
    .query<
      {
        id: string;
        description: string;
        product_id: string;
        unit_price_amount: number;
        unit_price_currency_code: CurrencyCode;
        type: "standard" | "custom";
        name: string | null;
        billing_cycle_frequency: number | null;
        billing_cycle_interval: Interval | null;
        tax_mode: "account_setting" | "external" | "internal";
        status: "active" | "archived";
        created_at: number;
        updated_at: number;
      },
      sqlite.SQLQueryBindings
    >("SELECT * FROM paddle_price WHERE id = $id")
    .get({ id });

  if (product === null) {
    throw new Error("Unreachable");
  }

  let productBillingCycle = null;
  if (product.billing_cycle_frequency !== null && product.billing_cycle_interval !== null) {
    productBillingCycle = {
      frequency: product.billing_cycle_frequency,
      interval: product.billing_cycle_interval,
    };
  } else if (product.billing_cycle_frequency === null && product.billing_cycle_interval === null) {
    productBillingCycle = null;
  } else {
    throw new Error("Unreachable");
  }

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      billing_cycle: productBillingCycle,
      trial_period: null,
      unit_price_overrides: [],
      // TODO
      quantity: {
        minimum: 1,
        maximum: 100,
      },
      status: product.status,
      id: product.id,
      description: product.description,
      product_id: product.product_id,
      unit_price: {
        amount: product.unit_price_amount.toString(),
        currency_code: product.unit_price_currency_code,
      },
      type: product.type,
      name: product.name,
      tax_mode: product.tax_mode,
      custom_data: null,
      import_meta: null,
      created_at: new Date(product.created_at).toISOString(),
      updated_at: new Date(product.updated_at).toISOString(),
    },
    meta: {
      request_id: authReq.id,
    },
  };

  return Response.json(resBody, {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
