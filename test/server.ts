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

  const newUrl = new URL("http://localhost:3001/o/oauth2/v2/auth");
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

function parseCookie(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const cookie of cookieHeader.split(";")) {
    const [key, value] = cookie.split("=");
    if (key !== undefined && value !== undefined) {
      cookies.set(key.trim(), value.trim());
    }
  }
  return cookies;
}

function callback(req: Request): Promise<Response> {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  if (code === null) {
    throw new Error("code is required");
  }

  const state = url.searchParams.get("state");
  if (state === null) {
    throw new Error("state is required");
  }

  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader === null) {
    throw new Error("Cookie header is required");
  }

  const cookies = parseCookie(cookieHeader);

  const storedState = cookies.get("auth_state");
  if (state !== storedState) {
    throw new Error("state does not match");
  }

  const codeVerifier = cookies.get("auth_code_verifier");
  if (codeVerifier === undefined) {
    throw new Error("code_verifier is required");
  }

  const authHeader = btoa("mock_client_id:mock_client_secret");

  return fetch("http://localhost:3002/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:3000/login-callback",
      code_verifier: codeVerifier,
    }),
  });
}

async function handle(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname;
  if (path === "/") {
    if (req.method === "GET") {
      return home(req);
    }
    return new Response(null, { status: 405 });
  }
  if (path === "/login-callback") {
    if (req.method === "GET") {
      return await callback(req);
    }
    return new Response(null, { status: 405 });
  }
  return new Response("Not found", { status: 404 });
}

Bun.serve({ port: 3000, fetch: handle });

await Bun.write("./ready0.fifo", "");
