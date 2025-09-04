import type * as sqlite from "bun:sqlite";
import * as paddle from "@src/api.paddle.com/util.ts";
import type { Context } from "@src/util.ts";

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
  billing_cycle_frequency: number | null;
  billing_cycle_interval: null | "day" | "week" | "month" | "year";
  tax_mode: "account_setting" | "external" | "internal";
  status: "active" | "archived";
  quantity_minimum: number;
  quantity_maximum: number;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes, account] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const rawQuery = new URL(ctx.req.url).searchParams;

  const reqQuery = {
    recurring: rawQuery.get("recurring") ?? null,
    product_id: rawQuery.get("product_id")?.split(",") ?? null,
  };

  let prices = null;
  if (reqQuery.product_id !== null) {
    prices = reqQuery.product_id.flatMap((product_id) =>
      ctx.db
        .query<Row, sqlite.SQLQueryBindings>(
          `
        SELECT paddle_price.*
        FROM paddle_price
        JOIN paddle_product ON paddle_price.product_id = paddle_product.id
        WHERE paddle_price.product_id = :product_id
          AND paddle_product.account_id = :account_id
          AND CASE 
              WHEN :recurring = 'true' THEN billing_cycle_frequency IS NOT NULL
              WHEN :recurring = 'false' THEN billing_cycle_frequency IS NULL
              ELSE TRUE
          END
      `,
        )
        .all({ product_id: product_id, account_id: account.id, recurring: reqQuery.recurring }),
    );
  } else {
    prices = ctx.db
      .query<Row, sqlite.SQLQueryBindings>(
        `
          SELECT paddle_price.*
          FROM paddle_price
          JOIN paddle_product ON paddle_price.product_id = paddle_product.id
          WHERE paddle_product.account_id = :account_id
            AND CASE 
                WHEN :recurring = 'true' THEN billing_cycle_frequency IS NOT NULL
                WHEN :recurring = 'false' THEN billing_cycle_frequency IS NULL
                ELSE TRUE
            END
        `,
      )
      .all({ account_id: account.id, recurring: reqQuery.recurring });
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
      tax_mode: price.tax_mode,
    };
  });

  return Response.json({ data }, { status: 200 });
}
