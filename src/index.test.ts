import { describe, expect, test } from "bun:test";
import { googleLogin, init } from "./index.ts";

describe("googleLogin", () => {
  const validUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  validUrl.searchParams.append("response_type", "code");
  validUrl.searchParams.append("client_id", "123");
  validUrl.searchParams.append("redirect_uri", "https://example.com");
  validUrl.searchParams.append("code_challenge_method", "S256");
  validUrl.searchParams.append(
    "code_challenge",
    "0123456789abcdef0123456789abcdef0123456789a",
  );

  test("success", async () => {
    const store = init();
    const response = await googleLogin(new Request(validUrl), { store });
    expect(response.status).toBe(200);
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
