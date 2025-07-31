// {
//   result: Response (334 bytes) {
//     ok: true,
//     url: "https://sandbox-api.paddle.com/products",
//     status: 201,
//     statusText: "Created",
//     headers: Headers {
//       "date": "Thu, 31 Jul 2025 05:51:59 GMT",
//       "content-type": "application/json",
//       "content-length": "334",
//       "connection": "keep-alive",
//       "cache-control": "no-store, max-age=0",
//       "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
//       "cross-origin-embedder-policy": "require-corp",
//       "cross-origin-opener-policy": "same-origin",
//       "cross-origin-resource-policy": "same-site",
//       "pragma": "no-cache",
//       "referrer-policy": "no-referrer",
//       "x-content-type-options": "nosniff",
//       "x-frame-options": "deny",
//       "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
//       "permissions-policy": "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),display-capture=(),document-dom
// ain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),layout-animations=(self),legacy-image-formats=(self),ma
// gnetometer=(),microphone=(),midi=(),oversized-images=(self),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-
// lock=(),speaker-selection=(),sync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),web-share=(),xr-spatial-tracking=()
// ",
//       "request-id": "0adb57ec-f3aa-46e8-837c-d7c5939f7bbc",
//       "x-permitted-cross-domain-policies": "none",
//       "x-robots-tag": "noindex, nofollow",
//       "cf-cache-status": "DYNAMIC",
//       "server": "cloudflare",
//       "cf-ray": "967ad3b94a096cfd-CGK",
//     },
//     redirected: false,
//     bodyUsed: false,
//     Blob (334 bytes)
//   },
// }
// {
//   "data": {
//     "id": "pro_01k1fgk4asanz79pvxz3qzn6md",
//     "name": "foo",
//     "tax_category": "saas",
//     "type": "standard",
//     "description": null,
//     "image_url": null,
//     "custom_data": null,
//     "status": "active",
//     "import_meta": null,
//     "created_at": "2025-07-31T05:51:59.321Z",
//     "updated_at": "2025-07-31T05:51:59.321Z"
//   },
//   "meta": {
//     "request_id": "0adb57ec-f3aa-46e8-837c-d7c5939f7bbc"
//   }
// }
//
// ~/tmp via 🥟 via C
// ❯ nix run nixpkgs#bun paddle.ts
// {
//   result: Response (334 bytes) {
//     ok: true,
//     url: "https://sandbox-api.paddle.com/products",
//     status: 201,
//     statusText: "Created",
//     headers: Headers {
//       "date": "Thu, 31 Jul 2025 06:10:45 GMT",
//       "content-type": "application/json",
//       "content-length": "334",
//       "connection": "keep-alive",
//       "cache-control": "no-store, max-age=0",
//       "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
//       "cross-origin-embedder-policy": "require-corp",
//       "cross-origin-opener-policy": "same-origin",
//       "cross-origin-resource-policy": "same-site",
//       "pragma": "no-cache",
//       "referrer-policy": "no-referrer",
//       "x-content-type-options": "nosniff",
//       "x-frame-options": "deny",
//       "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
//       "permissions-policy": "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),displ
// ay-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),lay
// out-animations=(self),legacy-image-formats=(self),magnetometer=(),microphone=(),midi=(),oversized-images=(se
// lf),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-lock=(),speaker-selection=(),s
// ync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),web-share=(),xr-spatial-tracking=()",
//       "request-id": "42a6c5f8-908b-4438-bc76-68926a63fed8",
//       "x-permitted-cross-domain-policies": "none",
//       "x-robots-tag": "noindex, nofollow",
//       "cf-cache-status": "DYNAMIC",
//       "server": "cloudflare",
//       "cf-ray": "967aef36ebc0e791-CGK",
//     },
//     redirected: false,
//     bodyUsed: false,
//     Blob (334 bytes)
//   },
// }
// {
//   "data": {
//     "id": "pro_01k1fhnfyacc0a56gexvtaq6ye",
//     "name": "foo",
//     "tax_category": "saas",
//     "type": "standard",
//     "description": null,
//     "image_url": null,
//     "custom_data": null,
//     "status": "active",
//     "import_meta": null,
//     "created_at": "2025-07-31T06:10:45.322Z",
//     "updated_at": "2025-07-31T06:10:45.322Z"
//   },
//   "meta": {
//     "request_id": "42a6c5f8-908b-4438-bc76-68926a63fed8"
//   }
// }
//
// ~/tmp via 🥟 via C
// ❯ nix run nixpkgs#bun paddle.ts
// {
//   result: Response (279 bytes) {
//     ok: false,
//     url: "https://sandbox-api.paddle.com/products",
//     status: 400,
//     statusText: "Bad Request",
//     headers: Headers {
//       "date": "Thu, 31 Jul 2025 06:11:02 GMT",
//       "content-type": "application/json",
//       "content-length": "279",
//       "connection": "keep-alive",
//       "cache-control": "no-store, max-age=0",
//       "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
//       "cross-origin-embedder-policy": "require-corp",
//       "cross-origin-opener-policy": "same-origin",
//       "cross-origin-resource-policy": "same-site",
//       "pragma": "no-cache",
//       "referrer-policy": "no-referrer",
//       "x-content-type-options": "nosniff",
//       "x-frame-options": "deny",
//       "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
//       "permissions-policy": "accelerometer=(),ambient-light-sensor=(),autoplay=(),battery=(),camera=(),displ
// ay-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),lay
// out-animations=(self),legacy-image-formats=(self),magnetometer=(),microphone=(),midi=(),oversized-images=(se
// lf),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-lock=(),speaker-selection=(),s
// ync-xhr=(self),unoptimized-images=(self),unsized-media=(self),usb=(),web-share=(),xr-spatial-tracking=()",
//       "request-id": "ce707dc4-83e4-438d-84cd-6793c2bc8b0e",
//       "x-permitted-cross-domain-policies": "none",
//       "x-robots-tag": "noindex, nofollow",
//       "cf-cache-status": "DYNAMIC",
//       "server": "cloudflare",
//       "cf-ray": "967aef9bfbe5e780-CGK",
//     },
//     redirected: false,
//     bodyUsed: false
//   },
// }
// {
//   "error": {
//     "type": "request_error",
//     "code": "product_tax_category_not_approved",
//     "detail": "tax category not approved",
//     "documentation_url": "https://developer.paddle.com/v1/errors/products/product_tax_category_not_approved"
//   },
//   "meta": {
//     "request_id": "ce707dc4-83e4-438d-84cd-6793c2bc8b0e"
//   }
// }
