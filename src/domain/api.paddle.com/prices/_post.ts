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
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import {
  authenticate,
  type FieldValidation,
  fieldAbsent,
  fieldEnum,
  fieldEnumValue,
  fieldRequired,
  fieldType,
  fieldValue,
  generateId,
  getBody,
  invalidRequest,
} from "@util/paddle";

type Path = openapi.paths["/prices"]["post"];

type CurrencyCode = openapi.components["schemas"]["currency_code"];

function validateUnitPrice(unitPrice: object): FieldValidation<{
  amount: string;
  currency_code: CurrencyCode;
}> {
  const [amountError, reqAmount] = !("amount" in unitPrice)
    ? fieldRequired("unit_price", "amount")
    : typeof unitPrice.amount !== "string"
      ? fieldType(unitPrice, "amount", "string")
      : fieldValue(unitPrice.amount);

  const [currencyCodeError, reqCurrencyCode] = !("currency_code" in unitPrice)
    ? fieldRequired("unit_price", "currency_code")
    : unitPrice.currency_code !== "USD" &&
        unitPrice.currency_code !== "EUR" &&
        unitPrice.currency_code !== "GBP" &&
        unitPrice.currency_code !== "JPY" &&
        unitPrice.currency_code !== "AUD" &&
        unitPrice.currency_code !== "CAD" &&
        unitPrice.currency_code !== "CHF" &&
        unitPrice.currency_code !== "HKD" &&
        unitPrice.currency_code !== "SGD" &&
        unitPrice.currency_code !== "SEK" &&
        unitPrice.currency_code !== "ARS" &&
        unitPrice.currency_code !== "BRL" &&
        unitPrice.currency_code !== "CNY" &&
        unitPrice.currency_code !== "COP" &&
        unitPrice.currency_code !== "CZK" &&
        unitPrice.currency_code !== "DKK" &&
        unitPrice.currency_code !== "HUF" &&
        unitPrice.currency_code !== "ILS" &&
        unitPrice.currency_code !== "INR" &&
        unitPrice.currency_code !== "KRW" &&
        unitPrice.currency_code !== "MXN" &&
        unitPrice.currency_code !== "NOK" &&
        unitPrice.currency_code !== "NZD" &&
        unitPrice.currency_code !== "PLN" &&
        unitPrice.currency_code !== "RUB" &&
        unitPrice.currency_code !== "THB" &&
        unitPrice.currency_code !== "TRY" &&
        unitPrice.currency_code !== "TWD" &&
        unitPrice.currency_code !== "UAH" &&
        unitPrice.currency_code !== "VND" &&
        unitPrice.currency_code !== "ZAR"
      ? fieldEnum("currency_code", [
          "USD",
          "EUR",
          "GBP",
          "JPY",
          "AUD",
          "CAD",
          "CHF",
          "HKD",
          "SGD",
          "SEK",
          "ARS",
          "BRL",
          "CNY",
          "COP",
          "CZK",
          "DKK",
          "HUF",
          "ILS",
          "INR",
          "KRW",
          "MXN",
          "NOK",
          "NZD",
          "PLN",
          "RUB",
          "THB",
          "TRY",
          "TWD",
          "UAH",
          "VND",
          "ZAR",
        ])
      : fieldEnumValue(unitPrice.currency_code);

  if (amountError !== undefined || currencyCodeError !== undefined) {
    const errors = [amountError, currencyCodeError].flat().filter((err) => err !== undefined);
    return [errors];
  }

  return [
    undefined,
    {
      amount: reqAmount,
      currency_code: reqCurrencyCode,
    },
  ];
}

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const [errorRes, rawBody] = await getBody(authReq, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const [descriptionError, reqDescription] = !("description" in rawBody)
    ? fieldRequired("(root)", "description")
    : typeof rawBody.description !== "string"
      ? fieldType(rawBody, "description", "string")
      : fieldValue(rawBody.description);

  const [productIdError, reqProductId] = !("product_id" in rawBody)
    ? fieldRequired("(root)", "product_id")
    : typeof rawBody.product_id !== "string"
      ? fieldType(rawBody, "product_id", "string")
      : fieldValue(rawBody.product_id);

  const [unitPriceError, reqUnitPrice] = !("unit_price" in rawBody)
    ? fieldRequired("(root)", "unit_price")
    : typeof rawBody.unit_price !== "object" || rawBody.unit_price === null
      ? fieldType(rawBody, "unit_price", "object")
      : validateUnitPrice(rawBody.unit_price);

  const [typeError, reqType] = !("type" in rawBody)
    ? fieldAbsent()
    : rawBody.type !== "standard" && rawBody.type !== "custom"
      ? fieldEnum("type", ["standard", "custom"])
      : fieldEnumValue(rawBody.type);

  const [nameError, reqName] = !("name" in rawBody)
    ? fieldRequired("(root)", "name")
    : typeof rawBody.name !== "string"
      ? fieldType(rawBody, "name", "string")
      : fieldValue(rawBody.name);

  const [taxModeError, reqTaxMode] = !("tax_mode" in rawBody)
    ? fieldAbsent()
    : rawBody.tax_mode !== "account_setting" &&
        rawBody.tax_mode !== "external" &&
        rawBody.tax_mode !== "internal"
      ? fieldEnum("tax_mode", ["account_setting", "external", "internal"])
      : fieldEnumValue(rawBody.tax_mode);

  if (
    descriptionError !== undefined ||
    productIdError !== undefined ||
    nameError !== undefined ||
    typeError !== undefined ||
    taxModeError !== undefined ||
    unitPriceError !== undefined
  ) {
    const errors = [
      descriptionError,
      productIdError,
      nameError,
      typeError,
      taxModeError,
      unitPriceError,
    ].filter((err) => err !== undefined);
    return invalidRequest(authReq, errors);
  }

  const reqBody: RequestBodyOf<Path> = {
    description: reqDescription,
    product_id: reqProductId,
    unit_price: reqUnitPrice,
    type: reqType,
    name: reqName,

    // TODO
    // billing_cycle: reqBillingCycle,

    // trial_period: reqTrialPeriod,
    tax_mode: reqTaxMode,
    // unit_price_overrides: reqUnitPriceOverrides,
    // quantity: reqQuantity,
    custom_data: null,
  };

  const id = `pri_${generateId()}`;

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
        tax_mode,
      )
      VALUES (
        $id,
        $description,
        $productId,
        $unitPriceAmount,
        $unitPriceCurrencyCode,
        $type,
        $name,
        $taxMode
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
    taxMode: reqBody.tax_mode ?? "account_setting",
  });

  const product = db
    .query<
      {
        id: string;
        description: string;
        product_id: string;
        unit_price_amount: string;
        unit_price_currency_code: CurrencyCode;
        type: "standard" | "custom";
        name: string | null;
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

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      billing_cycle: null,
      trial_period: null,
      unit_price_overrides: [],
      quantity: {
        minimum: 1,
        maximum: 100,
      },
      status: product.status,
      id: product.id,
      description: product.description,
      product_id: product.product_id,
      unit_price: {
        amount: product.unit_price_amount,
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
