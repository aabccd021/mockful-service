// 400
//{
// "error": {
//    "type": "request_error",
//    "code": "product_tax_category_not_approved",
//    "detail": "tax category not approved",
//    "documentation_url": "https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved"
//  },
//  "meta": {
//    "request_id": "ce707dc4-83e4-438d-84cd-6793c2bc8b0e"
//  }
//}
//{
//  "error": {
//     "type": "request_error",
//     "code": "bad_request",
//     "detail": "Invalid request.",
//     "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
//     "errors": [
//       {
//         "field": "tax_category",
//         "message": "must be one of the following: \"digital-goods\", \"ebooks\", \"implementation-services\", \"professional-services\", \"saas\", \"software-programming-services\", \"standard\", \"training-services\", \"website-hosting\""
//       }
//     ]
//   },
//   "meta": {
//     "request_id": "db318057-aee4-4898-918e-f908774017c0"
//   }
// }

// import * as sqlite from "bun:sqlite";
// import { db } from "@util/index";
// import * as paddle from "@util/paddle.ts";

export async function handle(_req: Request): Promise<Response> {
  // not implemented
  return new Response("Not implemented", { status: 501 });

  // const accountId = paddle.getAccountId(req);
  // if (accountId.type === "response") {
  //   return accountId.response;
  // }
  //
  // const reqCustomer = await req.json();
  //
  // s.assert(
  //   reqCustomer,
  //   s.object({
  //     name: s.string(),
  //     tax_category: enums([
  //       "digital-goods",
  //       "ebooks",
  //       "implementation-services",
  //       "professional-services",
  //       "saas",
  //       "software-programming-services",
  //       "standard",
  //       "training-services",
  //       "website-hosting",
  //     ]),
  //   }),
  // );
  //
  // const id = `ctm_${paddle.generateId()}`;
}
