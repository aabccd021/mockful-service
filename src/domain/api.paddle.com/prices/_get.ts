import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type ResponseBodyOf } from "@util/index";
import { authenticate } from "@util/paddle.ts";

type Path = openapi.paths["/prices"]["get"];

type Row = {
  id: string;
  description: string;
  product_id: string;
  unit_price_amount: number;
  unit_price_currency_code:
    | "USD"
    | "EUR"
    | "GBP"
    | "JPY"
    | "AUD"
    | "CAD"
    | "CHF"
    | "HKD"
    | "SGD"
    | "SEK"
    | "ARS"
    | "BRL"
    | "CNY"
    | "COP"
    | "CZK"
    | "DKK"
    | "HUF"
    | "ILS"
    | "INR"
    | "KRW"
    | "MXN"
    | "NOK"
    | "NZD"
    | "PLN"
    | "RUB"
    | "THB"
    | "TRY"
    | "TWD"
    | "UAH"
    | "VND"
    | "ZAR";
  type: "standard" | "custom";
  name: string | null;
  billing_cycle_frequency: number | null;
  billing_cycle_interval: null | "day" | "week" | "month" | "year";
  tax_mode: "account_setting" | "external" | "internal";
  status: "active" | "archived";
  created_at: number;
  updated_at: number;
  quantity_minimum: number;
  quantity_maximum: number;
};

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const query = new URL(req.url).searchParams;
  const queryRecurring = query.get("recurring") ?? null;
  const queryId = query.get("id")?.split(",");

  let prices = null;
  if (queryId !== undefined) {
    prices = queryId
      .map((id) =>
        db
          .query<Row, sqlite.SQLQueryBindings>(
            `
              SELECT * 
              FROM paddle_prices 
              WHERE id = $id 
                AND ($recurring IS NULL OR recurring = $recurring)
            `,
          )
          .get({ id, recurring: queryRecurring }),
      )
      .filter((val) => val !== null);
  } else {
    prices = db
      .query<Row, sqlite.SQLQueryBindings>(
        `
          SELECT * 
          FROM paddle_prices 
          WHERE account_id = $accountId
           AND ($recurring IS NULL OR recurring = $recurring)  
        `,
      )
      .all({ accountId: authReq.accountId, recurring: queryRecurring });
  }

  const data = prices.map((price) => {
    let priceBillingCycle = null;
    if (price.billing_cycle_frequency !== null && price.billing_cycle_interval !== null) {
      priceBillingCycle = {
        frequency: price.billing_cycle_frequency,
        interval: price.billing_cycle_interval,
      };
    } else if (price.billing_cycle_frequency === null && price.billing_cycle_interval === null) {
      priceBillingCycle = null;
    } else {
      throw new Error("Unreachable");
    }

    return {
      billing_cycle: priceBillingCycle,
      trial_period: null,
      unit_price_overrides: [],
      quantity: {
        minimum: price.quantity_minimum,
        maximum: price.quantity_maximum,
      },
      status: price.status,
      id: price.id,
      description: price.description,
      product_id: price.product_id,
      unit_price: {
        amount: price.unit_price_amount.toString(),
        currency_code: price.unit_price_currency_code,
      },
      type: price.type,
      name: price.name,
      tax_mode: price.tax_mode,
      custom_data: null,
      import_meta: null,
      created_at: new Date(price.created_at).toISOString(),
      updated_at: new Date(price.updated_at).toISOString(),
    };
  });

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
