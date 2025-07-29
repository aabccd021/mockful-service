import { writeFileSync } from "node:fs";

function home(req: Request): Response {
  const url = new URL(req.url);

  const forwardedParams = [
    "code_challenge",
    "code_challenge_method",
    "prompt",
    "response_type",
    "scope",
    "state",
    "client_id",
    "redirect_uri",
  ];

  const newUrl = new URL(
    "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  );
  for (const [key, value] of url.searchParams) {
    if (forwardedParams.includes(key)) {
      newUrl.searchParams.set(key, value);
    }
  }

  const headers = new Headers();

  const state = url.searchParams.get("state");
  if (state !== null) {
    headers.append(
      "Set-Cookie",
      `auth_state=${state}; Secure; Path=/; HttpOnly; Max-Age=600`,
    );
  }

  const codeVerifier = url.searchParams.get("code_verifier");
  if (codeVerifier !== null) {
    headers.append(
      "Set-Cookie",
      `auth_code_verifier=${codeVerifier}; Secure; Path=/; HttpOnly; Max-Age=600`,
    );
  }

  headers.set("Location", newUrl.toString());

  return new Response(undefined, { status: 302, headers });
}

function handle(req: Request): Response {
  const path = new URL(req.url).pathname;
  if (path === "/") {
    if (req.method === "GET") {
      return home(req);
    }
    return new Response(null, { status: 405 });
  }
  if (path === "/login-callback") {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const cookieHeader = req.headers.get("cookie");
      return new Response(
        JSON.stringify(
          {
            params: url.searchParams,
            cookie:
              cookieHeader !== null ? new Bun.CookieMap(cookieHeader) : null,
          },
          undefined,
          2,
        ),
        { status: 200 },
      );
    }
    return new Response(null, { status: 405 });
  }
  return new Response("Not found", { status: 404 });
}

Bun.serve({ port: 3000, fetch: handle });

writeFileSync("./server-ready.fifo", "");
