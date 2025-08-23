import type * as sqlite from "bun:sqlite";
import * as paddle from "@paddle/util.ts";
import type { Context } from "@util";

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
  created_at: number;
  updated_at: number;
  quantity_minimum: number;
  quantity_maximum: number;
};

export async function handle(ctx: Context): Promise<Response> {
  const [authErrorRes] = paddle.authenticate(ctx);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await ctx.req.json();

  const id = `pri_${paddle.generateId()}`;

  ctx.db
    .query(
      `
      INSERT INTO paddle_price (
        id,
        description,
        product_id,
        unit_price_amount,
        unit_price_currency_code,
        type,
        billing_cycle_frequency,
        billing_cycle_interval,
        tax_mode,
        quantity_minimum,
        quantity_maximum,
        created_at,
        updated_at
      )
      VALUES (
        :id,
        :description,
        :productId,
        :unitPriceAmount,
        :unitPriceCurrencyCode,
        :type,
        :billingCycleFrequency,
        :billingCycleInterval,
        :taxMode,
        :quantityMinimum,
        :quantityMaximum,
        :createdAt,
        :updatedAt
      )
    `,
    )
    .run({
      id,
      description: reqBody.description,
      productId: reqBody.product_id,
      unitPriceAmount: reqBody.unit_price.amount,
      unitPriceCurrencyCode: reqBody.unit_price.currency_code,
      type: reqBody.type ?? "standard",
      billingCycleFrequency: reqBody.billing_cycle?.frequency ?? null,
      billingCycleInterval: reqBody.billing_cycle?.interval ?? null,
      taxMode: reqBody.tax_mode ?? "account_setting",
      quantityMinimum: reqBody.quantity?.minimum ?? 1,
      quantityMaximum: reqBody.quantity?.maximum ?? 100,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

  const price = ctx.db
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_price WHERE id = :id")
    .get({ id });

  if (price === null) {
    throw new Error("Unreachable");
  }

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

  return Response.json(
    {
      data: {
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
        created_at: new Date(price.created_at).toISOString(),
        updated_at: new Date(price.updated_at).toISOString(),
      },
    },
    { status: 201 },
  );
}
