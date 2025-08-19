import type * as sqlite from "bun:sqlite";
import { db } from "@util/index";
import * as paddle from "@util/paddle";

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
  const [authErrorRes, authReq] = paddle.authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const reqBody = await req.json();

  const id = `pri_${paddle.generateId()}`;

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
        quantity_minimum,
        quantity_maximum,
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
        $quantityMinimum,
        $quantityMaximum,
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
    quantityMinimum: reqBody.quantity?.minimum ?? 1,
    quantityMaximum: reqBody.quantity?.maximum ?? 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const price = db
    .query<Row, sqlite.SQLQueryBindings>("SELECT * FROM paddle_price WHERE id = $id")
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
        created_at: new Date(price.created_at).toISOString(),
        updated_at: new Date(price.updated_at).toISOString(),
        trial_period: null,
        custom_data: null,
        import_meta: null,
      },
      meta: {
        request_id: authReq.id,
      },
    },
    { status: 201 },
  );
}
