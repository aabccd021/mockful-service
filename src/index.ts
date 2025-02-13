// https://github.com/oven-sh/bun/issues/16062
// https://github.com/tc39/proposal-arraybuffer-base64
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64#browser_compatibility
declare global {
  interface Uint8Array {
    toBase64(options?: {
      alphabet?: "base64url" | "base64";
      omitPadding?: boolean;
    }): string;
  }

  interface Uint8ArrayConstructor {
    fromBase64(
      base64: string,
      options?: { alphabet?: "base64url" | "base64" },
    ): Uint8Array;
  }
}

type CodeChallenge = { readonly method: "S256"; readonly value: string };

type LoginSession = {
  readonly codeChallenge: CodeChallenge | null;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope: string | null;
  readonly state: string | null;
};

type AuthSession = {
  readonly sub: string;
  readonly codeChallenge: CodeChallenge | null;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope: string | null;
};

const loginSessions = new Map<string, LoginSession>();

const authSessions = new Map<string, AuthSession>();

const base64urlChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const urlSafeChars = `${base64urlChars}.~`;

const _fetch: typeof globalThis.fetch = (url, reqInit) => {
  const req = url instanceof Request ? url : new Request(url, reqInit);
  if (req.url === "https://oauth2.googleapis.com/token") {
    return fetchGoogleToken(req);
  }
  return globalThis.fetch(url, reqInit);
};

export const fetch: typeof globalThis.fetch = _fetch;

function generateGoogleIdToken(clientId: string, sub: string): string {
  const idToken = {
    aud: clientId,
    exp: Date.now() + 3600,
    iat: Date.now(),
    iss: "https://accounts.google.com",
    sub,
  };

  const idTokenPayload = new TextEncoder()
    .encode(JSON.stringify(idToken))
    .toBase64({ alphabet: "base64url" });

  return `.${idTokenPayload}.`;
}

async function fetchGoogleToken(req: Request): Promise<Response> {
  const formData = await req.formData();

  const grantType = formData.get("grant_type");
  if (grantType !== "authorization_code") {
    console.error(
      `Invalid grant_type: "${grantType}"`,
      `Expected "authorization_code"`,
    );
    return new Response(null, { status: 400 });
  }

  const code = formData.get("code");
  if (typeof code !== "string") {
    console.error("Invalid code", code, "Expected string");
    return new Response(null, { status: 400 });
  }

  const authSession = authSessions.get(code);
  if (authSession === undefined) {
    console.error(`Auth session not found for code: "${code}"`);
    return new Response(null, { status: 400 });
  }
  authSessions.delete(code);

  if (authSession.codeChallenge?.method === "S256") {
    const codeVerifier = formData.get("code_verifier");
    if (typeof codeVerifier !== "string") {
      console.error("Invalid code_verifier", codeVerifier, "Expected string");
      return new Response(null, { status: 400 });
    }

    const codeChallengeBytes = new TextEncoder().encode(codeVerifier);
    const codeChallengeHash = await crypto.subtle.digest(
      "SHA-256",
      codeChallengeBytes,
    );
    const expectedCodeChallenge = new Uint8Array(codeChallengeHash).toBase64({
      alphabet: "base64url",
      omitPadding: true,
    });

    if (authSession.codeChallenge.value !== expectedCodeChallenge) {
      console.error(
        "Hash of code_verifier does not match code_challenge",
        `code_verifier: "${codeVerifier}"`,
        `code_challenge: "${authSession.codeChallenge.value}"`,
      );
      return new Response(null, { status: 400 });
    }
  }

  const redirectUri = formData.get("redirect_uri");
  if (
    redirectUri === null ||
    typeof redirectUri !== "string" ||
    redirectUri !== authSession.redirectUri
  ) {
    console.error(
      `Invalid redirect_uri: "${redirectUri}", expected "${authSession.redirectUri}"`,
    );
    return new Response(null, { status: 400 });
  }

  const contentType = req.headers.get("Content-Type");
  if (contentType !== "application/x-www-form-urlencoded") {
    console.error(
      `Invalid Content-Type: "${contentType}`,
      `Expected "application/x-www-form-urlencoded"`,
    );
    return new Response(null, { status: 400 });
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    console.error("Authorization header is required");
    return new Response(null, { status: 400 });
  }

  const [prefix, credentials] = authHeader.split(" ");
  if (prefix !== "Basic") {
    console.error(
      `Invalid Authorization header prefix: "${prefix}`,
      `Expected "Basic"`,
    );
    return new Response(null, { status: 400 });
  }

  if (credentials === undefined) {
    console.error("Credentials not found in Authorization header");
    return new Response(null, { status: 400 });
  }

  const [clientId, clientSecret] = atob(credentials).split(":");

  if (clientId !== authSession.clientId) {
    console.error(
      `Invalid client_id: "${clientId}`,
      `Expected "${authSession.clientId}"`,
    );
    return new Response(null, { status: 400 });
  }

  if (clientSecret !== "mock_client_secret") {
    console.error(
      `Invalid client_secret. Expected "mock_client_secret"`,
      "Never use production client_secret in tests",
    );
    return new Response(null, { status: 400 });
  }

  const scopes = authSession.scope?.split(" ") ?? [];

  const scopesOtherThanOpenId = scopes.filter((scope) => scope !== "openid");
  if (scopesOtherThanOpenId.length > 0) {
    console.warn(
      `Currently oauth2-mock does not support scopes other than "openid"`,
      "Some resources may not be accessible",
    );
  }

  const idToken = scopes.includes("openid")
    ? generateGoogleIdToken(clientId, authSession.sub)
    : undefined;

  const responseBody = {
    id_token: idToken,
    access_token: "mock_access_token",
    scope: authSession.scope,
    token_type: "Bearer",
    expires_in: 3600,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorMessage(...message: string[]): Response {
  return new Response(message.join(" "), {
    status: 400,
    headers: { "Content-Type": "text/plain" },
  });
}

function getCodeChallenge(
  searchParams: URLSearchParams,
): CodeChallenge | null | Response {
  const method = searchParams.get("code_challenge_method");
  const value = searchParams.get("code_challenge");

  if (method === null) {
    if (value === null) {
      return null;
    }

    return errorMessage(
      "code_challenge_method is required when code_challenge is provided",
    );
  }

  if (value === null) {
    return errorMessage(
      "code_challenge is required when code_challenge_method is provided",
    );
  }

  if (method === "plain") {
    return errorMessage(
      `Currently oauth2-mock does not support code_challenge_method "plain"`,
    );
  }

  if (method === "S256") {
    if (value.length !== 43) {
      return errorMessage(
        `Invalid code_challenge length: ${value.length}`,
        "Expected 43",
      );
    }
    for (const char of value) {
      if (!base64urlChars.includes(char)) {
        return errorMessage(
          `Invalid code_challenge character: "${char}"`,
          "Expected base64url character",
        );
      }
    }
    return { method, value };
  }

  return errorMessage(
    `Invalid code_challenge_method: "${method}`,
    `Expected "S256" or "plain"`,
  );
}

function handleLoginGet(req: Request): Response {
  const searchParams = new URL(req.url).searchParams;

  const responseType = searchParams.get("response_type");
  if (responseType !== "code") {
    return errorMessage(
      `Invalid response_type: "${responseType}".`,
      `Expected "code"`,
    );
  }

  const clientId = searchParams.get("client_id");
  if (clientId === null) {
    return errorMessage("Parameter client_id is required");
  }

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required");
  }

  const state = searchParams.get("state");
  if (state !== null) {
    if (state.length !== 43) {
      return errorMessage(`Invalid state length: ${state.length}`);
    }

    for (const char of state) {
      if (!urlSafeChars.includes(char)) {
        return errorMessage(
          `Invalid state character: "${char}"`,
          "Expected URL-safe character",
        );
      }
    }
  }

  const codeChallenge = getCodeChallenge(searchParams);
  if (codeChallenge instanceof Response) {
    return codeChallenge;
  }

  const scope = searchParams.get("scope");

  const code = crypto.randomUUID();

  loginSessions.set(code, {
    clientId,
    redirectUri,
    state,
    codeChallenge,
    scope,
  });

  const loginForm = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login with Google</title>
      </head>
      <body>
        <h1>Login with Google</h1>

        <p>Following fields are payload of id_token returned by https://oauth2.googleapis.com/token</p>

        <p>See 
          <a href="https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo">
            Google's OpenID Connect documentation
          </a>
          for more information
        </p>

        <form method="post">

          <input type="hidden" name="code" value="${code}" />

          <label for="google_auth_id_token_sub">sub</label>
          <input type="text" name="google_auth_id_token_sub" id="google_auth_id_token_sub" maxlength="255" required pattern="[a-zA-Z0-9]+" />

          <button>Submit</button>
        </form>

      </body>
    </html>
  `;
  return new Response(loginForm, { headers: { "Content-Type": "text/html" } });
}

async function handleLoginPost(req: Request): Promise<Response> {
  const formData = await req.formData();

  const code = formData.get("code");
  if (typeof code !== "string") {
    return new Response(null, { status: 400 });
  }

  const loginSession = loginSessions.get(code);
  if (loginSession === undefined) {
    return new Response(null, { status: 400 });
  }
  loginSessions.delete(code);

  const { clientId, redirectUri, codeChallenge, scope } = loginSession;

  const googleAuthIdTokenSub = formData.get("google_auth_id_token_sub");
  if (typeof googleAuthIdTokenSub !== "string") {
    return new Response(null, { status: 400 });
  }

  authSessions.set(code, {
    sub: googleAuthIdTokenSub,
    codeChallenge: codeChallenge,
    clientId: clientId,
    redirectUri: redirectUri,
    scope: scope,
  });

  const forwardedParamNames = ["state", "code", "scope", "authUser", "prompt"];

  const forwardedParams = Object.fromEntries(
    Object.entries(loginSession).filter(([key]) =>
      forwardedParamNames.includes(key),
    ),
  );

  const searchParams = new URLSearchParams({ ...forwardedParams, code });
  const redirectUriPath = new URL(redirectUri).pathname;
  const redirectLocation = `${redirectUriPath}?${searchParams.toString()}`;

  return new Response(null, {
    status: 303,
    headers: { Location: redirectLocation },
  });
}

export async function googleLogin(req: Request): Promise<Response> {
  if (req.method === "GET") {
    return handleLoginGet(req);
  }

  if (req.method === "POST") {
    return await handleLoginPost(req);
  }

  return new Response(null, { status: 400 });
}
