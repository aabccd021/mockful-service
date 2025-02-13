import { describe, expect, test } from "bun:test";
import { cloneStore, fetch, googleLogin, initStore } from "./index.ts";

describe("googleLogin", () => {
  describe("get", () => {
    const validUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    validUrl.searchParams.set("response_type", "code");
    validUrl.searchParams.set("client_id", "123");
    validUrl.searchParams.set(
      "redirect_uri",
      "https://example.com/login/callback",
    );
    validUrl.searchParams.set("code_challenge_method", "S256");
    validUrl.searchParams.set(
      "code_challenge",
      "0123456789abcdef0123456789abcdef0123456789a",
    );

    test("success", async () => {
      const getResponse = await googleLogin(new Request(validUrl));
      expect(getResponse.status).toBe(200);
    });

    test("success without code_challenge", async () => {
      const url = new URL(validUrl);
      url.searchParams.delete("code_challenge_method");
      url.searchParams.delete("code_challenge");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(200);
    });

    test("response_type is code", async () => {
      const url = new URL(validUrl);
      url.searchParams.set("response_type", "token");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Invalid response_type: "token". Expected "code".',
      );
    });

    test("client_id is required", async () => {
      const url = new URL(validUrl);
      url.searchParams.delete("client_id");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe("Parameter client_id is required.");
    });

    test("redirect_uri is required", async () => {
      const url = new URL(validUrl);
      url.searchParams.delete("redirect_uri");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter redirect_uri is required.",
      );
    });

    test("state length is not 43", async () => {
      const url = new URL(validUrl);
      url.searchParams.set("state", "123");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Invalid state length: 3. Expected 43.",
      );
    });

    test("state is not URL-safe", async () => {
      const url = new URL(validUrl);
      url.searchParams.set(
        "state",
        "[123456789abcdef0123456789abcdef0123456789a",
      );
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        `Invalid state character: "[". Expected URL-safe character.`,
      );
    });

    test("code_challenge_method is null but code_challenge is provided", async () => {
      const url = new URL(validUrl);
      url.searchParams.delete("code_challenge_method");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter code_challenge_method is required when code_challenge is provided.",
      );
    });

    test("code_challenge_method is provided but code_challenge is null", async () => {
      const url = new URL(validUrl);
      url.searchParams.delete("code_challenge");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter code_challenge is required when code_challenge_method is provided.",
      );
    });

    test("plain code_challenge_method is not supported", async () => {
      const url = new URL(validUrl);
      url.searchParams.set("code_challenge_method", "plain");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Currently oauth2-mock does not support code_challenge_method "plain."',
      );
    });

    test("s256 code_challenge length is not 43", async () => {
      const url = new URL(validUrl);
      url.searchParams.set("code_challenge", "123");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Invalid code_challenge length: 3. Expected 43.",
      );
    });

    test("s256 code_challenge is not URL-safe", async () => {
      const url = new URL(validUrl);
      url.searchParams.set(
        "code_challenge",
        "[123456789abcdef0123456789abcdef0123456789a",
      );
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        `Invalid code_challenge character: "[". Expected base64url character.`,
      );
    });

    test("s256 code_challenge is URL-safe but not base64url", async () => {
      const url = new URL(validUrl);
      url.searchParams.set(
        "code_challenge",
        "~123456789abcdef0123456789abcdef0123456789a",
      );
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        `Invalid code_challenge character: "~". Expected base64url character.`,
      );
    });

    test("unknown code_challenge_method is provided", async () => {
      const url = new URL(validUrl);
      url.searchParams.set("code_challenge_method", "S512");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Invalid code_challenge_method: "S512". Expected "S256" or "plain".',
      );
    });
  });

  describe("post", async () => {
    const validUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    validUrl.searchParams.set("response_type", "code");
    validUrl.searchParams.set("client_id", "123");
    validUrl.searchParams.set(
      "redirect_uri",
      "https://example.com/login/callback",
    );
    validUrl.searchParams.set("code_challenge_method", "S256");
    validUrl.searchParams.set(
      "code_challenge",
      "0123456789abcdef0123456789abcdef0123456789a",
    );

    const defaultStore = initStore();
    const getResponse = await googleLogin(new Request(validUrl), {
      store: defaultStore,
    });
    const code = getResponse.headers.get("auth-mock-code") ?? "";

    test("success", async () => {
      const postResponse = await googleLogin(
        new Request(validUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, google_auth_id_token_sub: "kita" }),
        }),
        { store: cloneStore(defaultStore) },
      );
      expect(postResponse.status).toBe(303);
      expect(postResponse.headers.get("Location")).toBe(
        `/login/callback?code=${code}`,
      );
    });

    test("no code", async () => {
      const postResponse = await googleLogin(
        new Request(validUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ google_auth_id_token_sub: "kita" }),
        }),
        { store: cloneStore(defaultStore) },
      );
      expect(postResponse.status).toBe(400);
    });

    test("invalid code", async () => {
      const invalidCode = "123";
      const postResponse = await googleLogin(
        new Request(validUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: invalidCode,
            google_auth_id_token_sub: "kita",
          }),
        }),
        { store: cloneStore(defaultStore) },
      );
      expect(invalidCode).not.toBe(code);
      expect(postResponse.status).toBe(400);
    });

    test("no google_auth_id_token_sub", async () => {
      const postResponse = await googleLogin(
        new Request(validUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code }),
        }),
        { store: cloneStore(defaultStore) },
      );
      expect(postResponse.status).toBe(400);
    });
  });
});

describe("fetch https://oauth2.googleapis.com/token", async () => {
  const codeVerifier = crypto
    .getRandomValues(new Uint8Array(32))
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const codeChallengeBytes = new TextEncoder().encode(codeVerifier);
  const codeChallenge = new Bun.CryptoHasher("sha256")
    .update(codeChallengeBytes)
    .digest()
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const validUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  validUrl.searchParams.set("response_type", "code");
  validUrl.searchParams.set("client_id", "mock_client_id");
  validUrl.searchParams.set(
    "redirect_uri",
    "https://example.com/login/callback",
  );
  validUrl.searchParams.set("code_challenge_method", "S256");
  validUrl.searchParams.set("code_challenge", codeChallenge);
  validUrl.searchParams.set("scope", "openid");

  const defaultStore = initStore();
  const getResponse = await googleLogin(new Request(validUrl), {
    store: defaultStore,
  });
  const code = getResponse.headers.get("auth-mock-code") ?? "";
  await googleLogin(
    new Request(validUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, google_auth_id_token_sub: "kita" }),
    }),
    { store: defaultStore },
  );

  const authHeader = btoa("mock_client_id:mock_client_secret");

  const validHeader = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${authHeader}`,
  });

  const validBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: "https://example.com/login/callback",
    code_verifier: codeVerifier,
  });

  test("success", async () => {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: validHeader,
        body: new URLSearchParams(validBody),
      },
      { store: cloneStore(defaultStore) },
    );

    expect(response.status).toBe(200);
    const body: unknown = await response.json();

    if (body === null) {
      throw new Error("Response body is null");
    }

    if (typeof body !== "object") {
      throw new Error("Response body is not an object");
    }

    if (!("id_token" in body)) {
      throw new Error("id_token is not in the response body");
    }

    if (typeof body.id_token !== "string") {
      throw new Error("id_token is not a string");
    }

    const idTokenPayload = body.id_token.split(".")[1];
    if (idTokenPayload === undefined) {
      throw new Error(`Id token payload is undefined: ${body.id_token}`);
    }

    const idTokenPayloadBytes = Uint8Array.fromBase64(idTokenPayload, {
      alphabet: "base64url",
    });
    const idToken: unknown = JSON.parse(
      new TextDecoder().decode(idTokenPayloadBytes),
    );

    if (idToken === null) {
      throw new Error("idToken is null");
    }

    if (typeof idToken !== "object") {
      throw new Error("idToken is not an object");
    }

    if (!("sub" in idToken)) {
      throw new Error("sub is not in the idToken");
    }

    if (typeof idToken.sub !== "string") {
      throw new Error("sub is not a string");
    }

    expect(idToken.sub).toBe("kita");
  });

  test("invalid grant_type", async () => {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: validHeader,
        body: new URLSearchParams({
          grant_type: "refresh_token",
          code,
          redirect_uri: "https://example.com/login/callback",
          code_verifier: codeVerifier,
        }),
      },
      { store: cloneStore(defaultStore) },
    );

    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe(
      `Invalid grant_type: "refresh_token". Expected "authorization_code".`,
    );
  });

  test("empty grant_type", async () => {
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: validHeader,
        body: new URLSearchParams({
          code,
          redirect_uri: "https://example.com/login/callback",
          code_verifier: codeVerifier,
        }),
      },
      { store: cloneStore(defaultStore) },
    );

    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe(
      'Invalid grant_type: "null". Expected "authorization_code".',
    );
  });
});
