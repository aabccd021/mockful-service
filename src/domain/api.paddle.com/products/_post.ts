// 201
//{
//  "data": {
//    "id": "pro_01k1fhnfyacc0a56gexvtaq6ye",
//    "name": "foo",
//    "tax_category": "saas",
//    "type": "standard",
//    "description": null,
//    "image_url": null,
//    "custom_data": null,
//    "status": "active",
//    "import_meta": null,
//    "created_at": "2025-07-31T06:10:45.322Z",
//    "updated_at": "2025-07-31T06:10:45.322Z"
//  },
//  "meta": {
//    "request_id": "42a6c5f8-908b-4438-bc76-68926a63fed8"
//  }
//}
//
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
//         "field": "(root)",
//         "message": "tax_category is required"
//       }
//     ]
//   },
//   "meta": {
//     "request_id": "13262964-cadf-486f-ac5a-dc6d7487d066"
//   }
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
//{
//  "error": {
//    "type": "request_error",
//    "code": "bad_request",
//    "detail": "Invalid request.",
//    "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
//    "errors": [
//      {
//        "field": "tax_category",
//        "message": "Invalid type. Expected: string, given: number"
//      }
//    ]
//  },
//  "meta": {
//    "request_id": "8cf50cb4-1bac-420e-a0f8-3e93f7eb98d5"
//  }
// }
//{
//  "error": {
//    "type": "request_error",
//    "code": "bad_request",
//    "detail": "Invalid request.",
//    "documentation_url": "https://developer.paddle.com/v1/errors/shared/bad_request",
//    "errors": [
//      {
//        "field": "name",
//        "message": "Invalid type. Expected: string, given: number"
//      },
//      {
//        "field": "tax_category",
//        "message": "must be one of the following: \"digital-goods\", \"ebooks\", \"implementation-services\", \"professional-services\", \"saas\", \"software-programming-services\", \"standard\", \"training-services\", \"website-hosting\""
//      }
//    ]
//  },
//  "meta": {
//    "request_id": "1a72030e-0fef-46ff-939c-f0b5d024359c"
//  }
//}

// import * as sqlite from "bun:sqlite";
// import { db } from "@util/index";
// import * as paddle from "@util/paddle.ts";
// import * as s from "superstruct";

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
