import { describe, expect, test } from "bun:test";
import { type Store, fetch, googleLogin, initStore } from "./index.ts";

describe("googleLogin", () => {
  function validUrl(): URL {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", "123");
    url.searchParams.set("redirect_uri", "https://example.com/login/callback");
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set(
      "code_challenge",
      "0123456789abcdef0123456789abcdef0123456789a",
    );
    return url;
  }

  describe("get", () => {
    test("success", async () => {
      const getResponse = await googleLogin(new Request(validUrl()));
      expect(getResponse.status).toBe(200);
    });

    test("success without code_challenge", async () => {
      const url = validUrl();
      url.searchParams.delete("code_challenge_method");
      url.searchParams.delete("code_challenge");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(200);
    });

    test("response_type is code", async () => {
      const url = validUrl();
      url.searchParams.set("response_type", "token");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Invalid response_type: "token". Expected "code".',
      );
    });

    test("client_id is required", async () => {
      const url = validUrl();
      url.searchParams.delete("client_id");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe("Parameter client_id is required.");
    });

    test("redirect_uri is required", async () => {
      const url = validUrl();
      url.searchParams.delete("redirect_uri");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter redirect_uri is required.",
      );
    });

    test("state length is not 43", async () => {
      const url = validUrl();
      url.searchParams.set("state", "123");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Invalid state length: 3. Expected 43.",
      );
    });

    test("state is not URL-safe", async () => {
      const url = validUrl();
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
      const url = validUrl();
      url.searchParams.delete("code_challenge_method");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter code_challenge_method is required when code_challenge is provided.",
      );
    });

    test("code_challenge_method is provided but code_challenge is null", async () => {
      const url = validUrl();
      url.searchParams.delete("code_challenge");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Parameter code_challenge is required when code_challenge_method is provided.",
      );
    });

    test("plain code_challenge_method is not supported", async () => {
      const url = validUrl();
      url.searchParams.set("code_challenge_method", "plain");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Currently oauth2-mock does not support code_challenge_method "plain."',
      );
    });

    test("s256 code_challenge length is not 43", async () => {
      const url = validUrl();
      url.searchParams.set("code_challenge", "123");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        "Invalid code_challenge length: 3. Expected 43.",
      );
    });

    test("s256 code_challenge is not URL-safe", async () => {
      const url = validUrl();
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
      const url = validUrl();
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
      const url = validUrl();
      url.searchParams.set("code_challenge_method", "S512");
      const response = await googleLogin(new Request(url));
      expect(response.status).toBe(400);
      expect(response.text()).resolves.toBe(
        'Invalid code_challenge_method: "S512". Expected "S256" or "plain".',
      );
    });
  });

  describe("post", () => {
    async function getValid(): Promise<{
      url: URL;
      code: string;
      store: Store;
      body: URLSearchParams;
    }> {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", "123");
      url.searchParams.set(
        "redirect_uri",
        "https://example.com/login/callback",
      );
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set(
        "code_challenge",
        "0123456789abcdef0123456789abcdef0123456789a",
      );

      const store = initStore();
      const getResponse = await googleLogin(new Request(url), { store });
      const code = getResponse.headers.get("auth-mock-code") ?? "";

      const body = new URLSearchParams({
        code,
        google_auth_id_token_sub: "kita",
      });

      return { url, code, store, body };
    }

    test("success", async () => {
      const valid = await getValid();
      const postResponse = await googleLogin(
        new Request(valid.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: valid.body,
        }),
        { store: valid.store },
      );
      expect(postResponse.text()).resolves.toBe("");
      expect(postResponse.status).toBe(303);
      const newUrl = new URL(
        postResponse.headers.get("Location") ?? "",
        "https://example.com",
      );
      expect(newUrl.pathname).toBe("/login/callback");
      expect(newUrl.searchParams.get("code")).toBe(valid.code);
    });

    test("no code", async () => {
      const valid = await getValid();
      valid.body.delete("code");
      const postResponse = await googleLogin(
        new Request(valid.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: valid.body,
        }),
        { store: valid.store },
      );
      expect(postResponse.status).toBe(400);
    });

    test("invalid code", async () => {
      const valid = await getValid();
      const invalidCode = "123";
      valid.body.set("code", invalidCode);
      const postResponse = await googleLogin(
        new Request(valid.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: valid.body,
        }),
        { store: valid.store },
      );
      expect(invalidCode).not.toBe(valid.code);
      expect(postResponse.status).toBe(400);
    });

    test("no google_auth_id_token_sub", async () => {
      const valid = await getValid();
      valid.body.delete("google_auth_id_token_sub");
      const postResponse = await googleLogin(
        new Request(valid.url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: valid.body,
        }),
        { store: valid.store },
      );
      expect(postResponse.status).toBe(400);
    });
  });
});

describe("fetch https://oauth2.googleapis.com/token", () => {
  async function getValid(): Promise<{
    store: Store;
    header: Headers;
    body: URLSearchParams;
  }> {
    const codeVerifier = crypto
      .getRandomValues(new Uint8Array(32))
      .toBase64({ alphabet: "base64url", omitPadding: true });

    const codeChallengeBytes = new TextEncoder().encode(codeVerifier);
    const codeChallenge = new Bun.CryptoHasher("sha256")
      .update(codeChallengeBytes)
      .digest()
      .toBase64({ alphabet: "base64url", omitPadding: true });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", "mock_client_id");
    url.searchParams.set("redirect_uri", "https://example.com/login/callback");
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("scope", "openid");

    const store = initStore();
    const getResponse = await googleLogin(new Request(url), { store });
    const code = getResponse.headers.get("auth-mock-code") ?? "";
    await googleLogin(
      new Request(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, google_auth_id_token_sub: "kita" }),
      }),
      { store },
    );

    const authHeader = btoa("mock_client_id:mock_client_secret");

    const header = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    });

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://example.com/login/callback",
      code_verifier: codeVerifier,
    });

    return { store, header, body };
  }

  test("success", async () => {
    const valid = await getValid();
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: valid.header,
        body: valid.body,
      },
      { store: valid.store },
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

  test("empty grant_type", async () => {
    const valid = await getValid();
    valid.body.delete("grant_type");
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: valid.header,
        body: valid.body,
      },
      { store: valid.store },
    );
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe("Parameter grant_type is required.");
  });

  test("invalid grant_type", async () => {
    const valid = await getValid();
    valid.body.set("grant_type", "refresh_token");
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: valid.header,
        body: valid.body,
      },
      { store: valid.store },
    );
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe(
      `Invalid grant_type: "refresh_token". Expected "authorization_code".`,
    );
  });

  test("empty code", async () => {
    const valid = await getValid();
    valid.body.delete("code");
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: valid.header,
        body: valid.body,
      },
      { store: valid.store },
    );
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe("Parameter code is required.");
  });

  test("invalid code", async () => {
    const valid = await getValid();
    valid.body.set("code", "123");
    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: valid.header,
        body: valid.body,
      },
      { store: valid.store },
    );
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe(
      'Auth session not found for code: "123".',
    );
  });
});
