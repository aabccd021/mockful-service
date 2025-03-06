// import { describe, expect, test } from "bun:test";
// import { type Store, fetch, googleLogin, initStore } from "./index.ts";
//
// function getIdTokenSub(body: unknown): string {
//   if (body === null) {
//     throw new Error("Response body is null");
//   }
//
//   if (typeof body !== "object") {
//     throw new Error(`Response body is not an object: ${JSON.stringify(body)}`);
//   }
//
//   if (!("id_token" in body)) {
//     throw new Error(
//       `id_token is not in the response body: ${JSON.stringify(body)}`,
//     );
//   }
//
//   if (typeof body.id_token !== "string") {
//     throw new Error(`id_token is not a string: ${body.id_token}`);
//   }
//
//   const idTokenPayload = body.id_token.split(".")[1];
//   if (idTokenPayload === undefined) {
//     throw new Error("Id token payload is undefined");
//   }
//
//   const idTokenPayloadBytes = Uint8Array.fromBase64(idTokenPayload, {
//     alphabet: "base64url",
//   });
//   const idToken: unknown = JSON.parse(
//     new TextDecoder().decode(idTokenPayloadBytes),
//   );
//
//   if (idToken === null) {
//     throw new Error("idToken is null");
//   }
//
//   if (typeof idToken !== "object") {
//     throw new Error(`idToken is not an object: ${JSON.stringify(idToken)}`);
//   }
//
//   if (!("sub" in idToken)) {
//     throw new Error(`sub is not in the idToken: ${JSON.stringify(idToken)}`);
//   }
//
//   if (typeof idToken.sub !== "string") {
//     throw new Error(`sub is not a string: ${idToken.sub}`);
//   }
//
//   return idToken.sub;
// }
//
// describe("googleLogin", () => {
//   test("invalid method", async () => {
//     const response = await googleLogin(
//       new Request("https://accounts.google.com/o/oauth2/v2/auth", {
//         method: "PUT",
//       }),
//     );
//     expect(response.status).toBe(405);
//     expect(response.text()).resolves.toBe("Method Not Allowed");
//   });
//
//   describe("get", () => {
//     function validUrl(): URL {
//       const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
//       url.searchParams.set("response_type", "code");
//       url.searchParams.set("client_id", "123");
//       url.searchParams.set(
//         "redirect_uri",
//         "https://example.com/login/callback",
//       );
//       url.searchParams.set("code_challenge_method", "S256");
//       url.searchParams.set(
//         "code_challenge",
//         "0123456789abcdef0123456789abcdef0123456789a",
//       );
//       return url;
//     }

//     test("redirect_uri is required", async () => {
//       const url = validUrl();
//       url.searchParams.delete("redirect_uri");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         "Parameter redirect_uri is required.",
//       );
//     });

//     test("state is not URL-safe", async () => {
//       const url = validUrl();
//       url.searchParams.set(
//         "state",
//         "[123456789abcdef0123456789abcdef0123456789a",
//       );
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         `Invalid state character: "[". Expected URL-safe character.`,
//       );
//     });
//
//     test("code_challenge length is not 43", async () => {
//       const url = validUrl();
//       url.searchParams.set("code_challenge", "123");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         "Invalid code_challenge length: 3. Expected 43.",
//       );
//     });
//
//     test("code_challenge_method is null but code_challenge is provided", async () => {
//       const url = validUrl();
//       url.searchParams.delete("code_challenge_method");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         "Parameter code_challenge_method is required when code_challenge is provided.",
//       );
//     });
//
//     test("code_challenge_method is provided but code_challenge is null", async () => {
//       const url = validUrl();
//       url.searchParams.delete("code_challenge");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         "Parameter code_challenge is required when code_challenge_method is provided.",
//       );
//     });
//
//     test("plain code_challenge_method is not supported", async () => {
//       const url = validUrl();
//       url.searchParams.set("code_challenge_method", "plain");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         'Currently oauth2-mock does not support code_challenge_method "plain."',
//       );
//     });
//
//     test("s256 code_challenge length is not 43", async () => {
//       const url = validUrl();
//       url.searchParams.set("code_challenge", "123");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         "Invalid code_challenge length: 3. Expected 43.",
//       );
//     });
//
//     test("s256 code_challenge is not URL-safe", async () => {
//       const url = validUrl();
//       url.searchParams.set(
//         "code_challenge",
//         "[123456789abcdef0123456789abcdef0123456789a",
//       );
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         `Invalid code_challenge character: "[". Expected base64url character.`,
//       );
//     });
//
//     test("s256 code_challenge is URL-safe but not base64url", async () => {
//       const url = validUrl();
//       url.searchParams.set(
//         "code_challenge",
//         "~123456789abcdef0123456789abcdef0123456789a",
//       );
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         `Invalid code_challenge character: "~". Expected base64url character.`,
//       );
//     });
//
//     test("unknown code_challenge_method is provided", async () => {
//       const url = validUrl();
//       url.searchParams.set("code_challenge_method", "S512");
//       const response = await googleLogin(new Request(url));
//       expect(response.status).toBe(400);
//       expect(response.text()).resolves.toBe(
//         'Invalid code_challenge_method: "S512". Expected "S256" or "plain".',
//       );
//     });
//   });
//
//   describe("post", () => {
//     async function getValid(): Promise<{
//       url: URL;
//       code: string;
//       store: Store;
//       body: URLSearchParams;
//     }> {
//       const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
//       url.searchParams.set("response_type", "code");
//       url.searchParams.set("client_id", "123");
//       url.searchParams.set(
//         "redirect_uri",
//         "https://example.com/login/callback",
//       );
//       url.searchParams.set("state", "1234");
//       url.searchParams.set("code_challenge_method", "S256");
//       url.searchParams.set(
//         "code_challenge",
//         "0123456789abcdef0123456789abcdef0123456789a",
//       );
//
//       const store = initStore();
//       const getResponse = await googleLogin(new Request(url), { store });
//       const code = getResponse.headers.get("auth-mock-code") ?? "";
//
//       const body = new URLSearchParams({
//         code,
//         google_auth_id_token_sub: "kita",
//       });
//
//       return { url, code, store, body };
//     }
//
//     test("success", async () => {
//       const valid = await getValid();
//       const postResponse = await googleLogin(
//         new Request(valid.url, {
//           method: "POST",
//           body: valid.body,
//         }),
//         { store: valid.store },
//       );
//       expect(postResponse.text()).resolves.toBe("");
//       expect(postResponse.status).toBe(303);
//       const newUrl = new URL(
//         postResponse.headers.get("Location") ?? "",
//         "https://example.com",
//       );
//       expect(newUrl.pathname).toBe("/login/callback");
//       expect(newUrl.searchParams.get("code")).toBe(valid.code);
//       expect(newUrl.searchParams.get("state")).toBe("1234");
//     });
//
//     test("no code", async () => {
//       const valid = await getValid();
//       valid.body.delete("code");
//       const postResponse = await googleLogin(
//         new Request(valid.url, {
//           method: "POST",
//           body: valid.body,
//         }),
//         { store: valid.store },
//       );
//       expect(postResponse.status).toBe(400);
//     });
//
//     test("invalid code", async () => {
//       const valid = await getValid();
//       const invalidCode = "123";
//       valid.body.set("code", invalidCode);
//       const postResponse = await googleLogin(
//         new Request(valid.url, {
//           method: "POST",
//           body: valid.body,
//         }),
//         { store: valid.store },
//       );
//       expect(invalidCode).not.toBe(valid.code);
//       expect(postResponse.status).toBe(400);
//     });
//
//     test("no google_auth_id_token_sub", async () => {
//       const valid = await getValid();
//       valid.body.delete("google_auth_id_token_sub");
//       const postResponse = await googleLogin(
//         new Request(valid.url, {
//           method: "POST",
//           body: valid.body,
//         }),
//         { store: valid.store },
//       );
//       expect(postResponse.status).toBe(400);
//     });
//   });
// });
//
// describe("fetch https://oauth2.googleapis.com/token", () => {
//   const authHeader = btoa("mock_client_id:mock_client_secret");
//
//   function getUrl(): URL {
//     const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
//     url.searchParams.set("response_type", "code");
//     url.searchParams.set("client_id", "mock_client_id");
//     url.searchParams.set("redirect_uri", "https://example.com/login/callback");
//     url.searchParams.set("scope", "openid");
//
//     return url;
//   }
//
//   async function getValid(url: URL): Promise<{
//     store: Store;
//     header: Headers;
//     body: URLSearchParams;
//   }> {
//     const store = initStore();
//     const getResponse = await googleLogin(new Request(url), { store });
//     const code = getResponse.headers.get("auth-mock-code") ?? "";
//     await googleLogin(
//       new Request(url, {
//         method: "POST",
//         body: new URLSearchParams({ code, google_auth_id_token_sub: "kita" }),
//       }),
//       { store },
//     );
//
//     const header = new Headers({
//       Authorization: `Basic ${authHeader}`,
//     });
//
//     const body = new URLSearchParams({
//       grant_type: "authorization_code",
//       code,
//       redirect_uri: "https://example.com/login/callback",
//     });
//
//     return { store, header, body };
//   }
//
//   async function validS256(): Promise<{
//     store: Store;
//     header: Headers;
//     body: URLSearchParams;
//   }> {
//     const url = getUrl();
//     const codeVerifier = "0123456789abcdef0123456789abcdef0123456789a";
//     const codeChallengeBytes = new TextEncoder().encode(codeVerifier);
//     const codeChallenge = new Bun.CryptoHasher("sha256")
//       .update(codeChallengeBytes)
//       .digest()
//       .toBase64({ alphabet: "base64url", omitPadding: true });
//     url.searchParams.set("code_challenge_method", "S256");
//     url.searchParams.set("code_challenge", codeChallenge);
//     const valid = await getValid(url);
//     valid.body.set("code_verifier", codeVerifier);
//     return valid;
//   }
//
//   test("success", async () => {
//     const url = getUrl();
//     const valid = await getValid(url);
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(200);
//     const body: unknown = await response.json();
//     expect(getIdTokenSub(body)).toBe("kita");
//     expect(body).toMatchObject({
//       access_token: "mock_access_token",
//       expires_in: 3600,
//       token_type: "Bearer",
//       id_token: expect.any(String),
//     });
//   });
//
//   test("success without scope", async () => {
//     const url = getUrl();
//     url.searchParams.delete("scope");
//     const valid = await getValid(url);
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(200);
//     const body: object = await response.json();
//     expect(body).toEqual({
//       access_token: "mock_access_token",
//       expires_in: 3600,
//       token_type: "Bearer",
//     });
//   });
//
//   test("s256 success", async () => {
//     const valid = await validS256();
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(200);
//     const body: unknown = await response.json();
//     expect(getIdTokenSub(body)).toBe("kita");
//   });
//
//   test("s256 empty code_verifier", async () => {
//     const valid = await validS256();
//     valid.body.delete("code_verifier");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       "Parameter code_verifier is required.",
//     );
//   });
//
//   test("s256 invalid code_verifier", async () => {
//     const valid = await validS256();
//     valid.body.set("code_verifier", "123");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       `Hash of code_verifier does not match code_challenge. code_verifier: "123". code_challenge: "JjuXQb_IRZi49WiMVIGIfIST1AsLVX3i8vmwMpE5xds".`,
//     );
//   });
//
//   test("empty redirect_uri", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.delete("redirect_uri");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       "Parameter redirect_uri is required.",
//     );
//   });
//
//   test("invalid redirect_uri", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.set("redirect_uri", "https://example.com/login/callback2");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid redirect_uri: "https://example.com/login/callback2". Expected "https://example.com/login/callback".',
//     );
//   });
//
//   test("empty grant_type", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.delete("grant_type");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe("Parameter grant_type is required.");
//   });
//
//   test("empty auth header", async () => {
//     const valid = await getValid(getUrl());
//     valid.header.delete("Authorization");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe("Authorization header is required.");
//   });
//
//   test("invalid auth header", async () => {
//     const valid = await getValid(getUrl());
//     valid.header.set("Authorization", `NOT_BASIC ${authHeader}`);
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid Authorization header prefix: "NOT_BASIC". Expected "Basic".',
//     );
//   });
//
//   test("empty credentials", async () => {
//     const valid = await getValid(getUrl());
//     valid.header.set("Authorization", "Basic ");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       "Credentials not found in Authorization header.",
//     );
//   });
//
//   test("invalid clientID", async () => {
//     const valid = await getValid(getUrl());
//     const invalidCredential = btoa("invalid_client_id:mock_client_secret");
//     valid.header.set("Authorization", `Basic ${invalidCredential}`);
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       `Invalid client_id: "invalid_client_id". Expected "mock_client_id".`,
//     );
//   });
//
//   test("invalid clientSecret", async () => {
//     const valid = await getValid(getUrl());
//     const invalidCredential = btoa("mock_client_id:invalid_client_secret");
//     valid.header.set("Authorization", `Basic ${invalidCredential}`);
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid client_secret. Expected "mock_client_secret". Never use production client_secret in tests.',
//     );
//   });
//
//   test("invalid grant_type", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.set("grant_type", "refresh_token");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       `Invalid grant_type: "refresh_token". Expected "authorization_code".`,
//     );
//   });
//
//   test("empty code", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.delete("code");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe("Parameter code is required.");
//   });
//
//   test("invalid code", async () => {
//     const valid = await getValid(getUrl());
//     valid.body.set("code", "123");
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: valid.body,
//       },
//       { store: valid.store },
//     );
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Auth session not found for code: "123".',
//     );
//   });
//
//   test("code is file", async () => {
//     const valid = await getValid(getUrl());
//     valid.header.delete("Content-Type");
//     const invalidBody = new FormData();
//     for (const [key, value] of valid.body) {
//       invalidBody.set(key, value);
//     }
//     invalidBody.set("code", new File([], "foo.txt"));
//
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: invalidBody,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid code type: "file". Expected "string".',
//     );
//   });
//
//   test("code_verifier is file", async () => {
//     const valid = await validS256();
//     valid.header.delete("Content-Type");
//     const invalidBody = new FormData();
//     for (const [key, value] of valid.body) {
//       invalidBody.set(key, value);
//     }
//     invalidBody.set("code_verifier", new File([], "foo.txt"));
//
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: invalidBody,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid code_verifier type: "file". Expected "string".',
//     );
//   });
//
//   test("redirect_uri is file", async () => {
//     const valid = await getValid(getUrl());
//     valid.header.delete("Content-Type");
//     const invalidBody = new FormData();
//     for (const [key, value] of valid.body) {
//       invalidBody.set(key, value);
//     }
//     invalidBody.set("redirect_uri", new File([], "foo.txt"));
//
//     const response = await fetch(
//       "https://oauth2.googleapis.com/token",
//       {
//         method: "POST",
//         headers: valid.header,
//         body: invalidBody,
//       },
//       { store: valid.store },
//     );
//
//     expect(response.status).toBe(400);
//     expect(response.text()).resolves.toBe(
//       'Invalid redirect_uri type: "file". Expected "string".',
//     );
//   });
// });
//
// describe("fetch", () => {
//   test("invalid URL", () => {
//     expect(fetch("https://doesnt-exists.com")).rejects.toThrow(
//       "Unable to connect. Is the computer able to access the url?",
//     );
//   });
// });
