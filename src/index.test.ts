import { describe, expect, test } from "bun:test";
import { googleLogin } from "./index.ts";

describe("googleLogin", () => {
  test("response_type is code", async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("response_type", "token");
    const response = await googleLogin(new Request(url));
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe(
      'Invalid response_type: "token". Expected "code"',
    );
  });

  test("client_id is required", async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("response_type", "code");
    const response = await googleLogin(new Request(url));
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe("Parameter client_id is required");
  });

  test("redirect_uri is required", async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("client_id", "123");
    const response = await googleLogin(new Request(url));
    expect(response.status).toBe(400);
    expect(response.text()).resolves.toBe("Parameter redirect_uri is required");
  });
});
