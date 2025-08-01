import type * as sqlite from "bun:sqlite";
import type * as openapi from "@openapi/paddle.ts";
import { db, type RequestBodyOf, type ResponseBodyOf } from "@util/index";
import {
  authenticate,
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

type Path = openapi.paths["/products"]["post"];

export async function handle(req: Request): Promise<Response> {
  const [authErrorRes, authReq] = authenticate(req);
  if (authErrorRes !== undefined) {
    return authErrorRes;
  }

  const [errorRes, rawBody] = await getBody(authReq, req);
  if (errorRes !== undefined) {
    return errorRes;
  }

  const [nameError, reqName] = !("name" in rawBody)
    ? fieldRequired("(root)", "name")
    : typeof rawBody.name !== "string"
      ? fieldType(rawBody, "name", "string")
      : fieldValue(rawBody.name);

  const [taxCategoryError, reqTaxCategory] = !("tax_category" in rawBody)
    ? fieldRequired("(root)", "tax_category")
    : rawBody.tax_category !== "digital-goods" &&
        rawBody.tax_category !== "ebooks" &&
        rawBody.tax_category !== "implementation-services" &&
        rawBody.tax_category !== "professional-services" &&
        rawBody.tax_category !== "saas" &&
        rawBody.tax_category !== "software-programming-services" &&
        rawBody.tax_category !== "standard" &&
        rawBody.tax_category !== "training-services" &&
        rawBody.tax_category !== "website-hosting"
      ? fieldEnum("tax_category", [
          "digital-goods",
          "ebooks",
          "implementation-services",
          "professional-services",
          "saas",
          "software-programming-services",
          "standard",
          "training-services",
          "website-hosting",
        ])
      : fieldEnumValue(rawBody.tax_category);

  const [descriptionError, reqDescription] = !("description" in rawBody)
    ? fieldAbsent()
    : typeof rawBody.description !== "string"
      ? fieldType(rawBody, "description", "string")
      : fieldValue(rawBody.description);

  const [typeError, reqType] = !("type" in rawBody)
    ? fieldAbsent()
    : rawBody.type !== "standard" && rawBody.type !== "custom"
      ? fieldEnum("type", ["standard", "custom"])
      : fieldEnumValue(rawBody.type);

  const [imageUrlError, reqImageUrl] = !("image_url" in rawBody)
    ? fieldAbsent()
    : typeof rawBody.image_url !== "string"
      ? fieldType(rawBody, "image_url", "string")
      : fieldValue(rawBody.image_url);

  if (
    nameError !== undefined ||
    taxCategoryError !== undefined ||
    descriptionError !== undefined ||
    typeError !== undefined ||
    imageUrlError !== undefined
  ) {
    const errors = [nameError, taxCategoryError, descriptionError, typeError, imageUrlError].filter(
      (err) => err !== undefined,
    );
    return invalidRequest(authReq, errors);
  }

  const reqBody: RequestBodyOf<Path> = {
    name: reqName,
    tax_category: reqTaxCategory,
    description: reqDescription,
    type: reqType,
    image_url: reqImageUrl,
  };

  const enabledCategory = db
    .query(
      `
        SELECT * 
        FROM paddle_account_tax_category_enabled 
        WHERE account_id = $accountId 
        AND tax_category = $taxCategory
      `,
    )
    .get({
      accountId: authReq.accountId,
      taxCategory: reqBody.tax_category,
    });

  if (enabledCategory === null) {
    return Response.json(
      {
        error: {
          type: "request_error",
          code: "product_tax_category_not_approved",
          detail: "tax category not approved",
          documentation_url:
            "https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved",
        },
        meta: {
          request_id: authReq.id,
        },
      },
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const id = `pro_${generateId()}`;

  db.query(
    `
      INSERT INTO paddle_product (
        account_id, 
        id, 
        name,
        tax_category,
        description,
        type,
        image_url,
        created_at,
        updated_at
      )
      VALUES (
        $accountId, 
        $id, 
        $name,
        $taxCategory,
        $description,
        $type,
        $imageUrl,
        $createdAt,
        $updatedAt
      )
    `,
  ).run({
    accountId: authReq.accountId,
    id,
    name: reqBody.name,
    taxCategory: reqBody.tax_category,
    description: reqBody.description ?? null,
    type: reqBody.type ?? "standard",
    imageUrl: reqBody.image_url ?? null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const product = db
    .query<
      {
        id: string;
        account_id: string;
        tax_category:
          | "digital-goods"
          | "ebooks"
          | "implementation-services"
          | "professional-services"
          | "saas"
          | "software-programming-services"
          | "standard"
          | "training-services"
          | "website-hosting";
        created_at: number;
        updated_at: number;
        name: string;
        description?: string;
        type: "standard" | "custom";
        image_url?: string;
        status: "active" | "archived";
      },
      sqlite.SQLQueryBindings
    >("SELECT * FROM paddle_product WHERE id = $id")
    .get({ id });

  if (product === null) {
    throw new Error("Unreachable");
  }

  const resBody: ResponseBodyOf<Path, 201> = {
    data: {
      id: product.id,
      tax_category: product.tax_category,
      created_at: new Date(product.created_at).toISOString(),
      updated_at: new Date(product.updated_at).toISOString(),
      name: product.name,
      description: product.description ?? null,
      type: product.type,
      image_url: product.image_url ?? null,
      custom_data: null,
      status: product.status,
      import_meta: null,
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
