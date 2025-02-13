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

export type Store = {
  readonly authSessions: Map<string, AuthSession>;
  readonly loginSessions: Map<string, LoginSession>;
};

export function initStore(): Store {
  return {
    authSessions: new Map<string, AuthSession>(),
    loginSessions: new Map<string, LoginSession>(),
  };
}

function errorMessage(...message: unknown[]): Response {
  const text = message.map((m) =>
    typeof m === "string" ||
    typeof m === "number" ||
    typeof m === "bigint" ||
    typeof m === "boolean" ||
    m === null ||
    m === undefined
      ? `${m}`
      : JSON.stringify(m),
  );
  return new Response(text.join(" "), {
    status: 400,
    headers: { "Content-Type": "text/plain" },
  });
}

const defaulStore = initStore();

const base64urlChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const urlSafeChars = `${base64urlChars}.~`;

export function fetch(
  url: Request | string | URL,
  reqInit?: RequestInit,
  option?: { store?: Store },
): Promise<Response> {
  const req = url instanceof Request ? url : new Request(url, reqInit);
  if (req.url === "https://oauth2.googleapis.com/token") {
    return fetchGoogleToken(req, option);
  }
  return globalThis.fetch(url, reqInit);
}

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

async function fetchGoogleToken(
  req: Request,
  option?: { store?: Store },
): Promise<Response> {
  const formData = await req.formData();

  const grantType = formData.get("grant_type");

  if (grantType === null) {
    return errorMessage("Parameter grant_type is required.");
  }

  if (grantType !== "authorization_code") {
    return errorMessage(
      `Invalid grant_type: "${grantType}".`,
      `Expected "authorization_code".`,
    );
  }

  const code = formData.get("code");

  if (code === null) {
    return errorMessage("Parameter code is required.");
  }

  if (typeof code !== "string") {
    return errorMessage("Invalid code", code, "Expected string");
  }

  const store = option?.store ?? defaulStore;
  const authSession = store.authSessions.get(code);
  if (authSession === undefined) {
    return errorMessage(`Auth session not found for code: "${code}".`);
  }
  store.authSessions.delete(code);

  if (authSession.codeChallenge?.method === "S256") {
    const codeVerifier = formData.get("code_verifier");
    if (typeof codeVerifier !== "string") {
      return errorMessage(
        "Invalid code_verifier",
        codeVerifier,
        "Expected string",
      );
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
      return errorMessage(
        "Hash of code_verifier does not match code_challenge",
        `code_verifier: "${codeVerifier}"`,
        `code_challenge: "${authSession.codeChallenge.value}"`,
      );
    }
  }

  const redirectUri = formData.get("redirect_uri");
  if (
    redirectUri === null ||
    typeof redirectUri !== "string" ||
    redirectUri !== authSession.redirectUri
  ) {
    return errorMessage(
      `Invalid redirect_uri: "${redirectUri}", expected "${authSession.redirectUri}"`,
    );
  }

  const contentType = req.headers.get("Content-Type");
  if (contentType !== "application/x-www-form-urlencoded") {
    return errorMessage(
      `Invalid Content-Type: "${contentType}`,
      `Expected "application/x-www-form-urlencoded"`,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    return errorMessage("Authorization header is required");
  }

  const [prefix, credentials] = authHeader.split(" ");
  if (prefix !== "Basic") {
    return errorMessage(
      `Invalid Authorization header prefix: "${prefix}`,
      `Expected "Basic"`,
    );
  }

  if (credentials === undefined) {
    return errorMessage("Credentials not found in Authorization header");
  }

  const [clientId, clientSecret] = atob(credentials).split(":");

  if (clientId !== authSession.clientId) {
    return errorMessage(
      `Invalid client_id: "${clientId}`,
      `Expected "${authSession.clientId}"`,
    );
  }

  if (clientSecret !== "mock_client_secret") {
    return errorMessage(
      `Invalid client_secret. Expected "mock_client_secret"`,
      "Never use production client_secret in tests",
    );
  }

  const scopes = authSession.scope?.split(" ") ?? [];

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
      "Parameter code_challenge_method is required when code_challenge is provided.",
    );
  }

  if (value === null) {
    return errorMessage(
      "Parameter code_challenge is required when code_challenge_method is provided.",
    );
  }

  // TODO: support "plain" code_challenge_method
  if (method === "plain") {
    return errorMessage(
      'Currently oauth2-mock does not support code_challenge_method "plain."',
    );
  }

  if (method === "S256") {
    if (value.length !== 43) {
      return errorMessage(
        `Invalid code_challenge length: ${value.length}.`,
        "Expected 43.",
      );
    }
    for (const char of value) {
      if (!base64urlChars.includes(char)) {
        return errorMessage(
          `Invalid code_challenge character: "${char}".`,
          "Expected base64url character.",
        );
      }
    }
    return { method, value };
  }

  return errorMessage(
    `Invalid code_challenge_method: "${method}".`,
    `Expected "S256" or "plain".`,
  );
}

function handleLoginGet(req: Request, option?: { store?: Store }): Response {
  const searchParams = new URL(req.url).searchParams;

  const responseType = searchParams.get("response_type");
  if (responseType !== "code") {
    return errorMessage(
      `Invalid response_type: "${responseType}".`,
      `Expected "code".`,
    );
  }

  const clientId = searchParams.get("client_id");
  if (clientId === null) {
    return errorMessage("Parameter client_id is required.");
  }

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const state = searchParams.get("state");
  if (state !== null) {
    if (state.length !== 43) {
      return errorMessage(
        `Invalid state length: ${state.length}.`,
        "Expected 43.",
      );
    }

    for (const char of state) {
      if (!urlSafeChars.includes(char)) {
        return errorMessage(
          `Invalid state character: "${char}".`,
          "Expected URL-safe character.",
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

  const store = option?.store ?? defaulStore;
  store.loginSessions.set(code, {
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
  return new Response(loginForm, {
    headers: {
      "Content-Type": "text/html",
      // for testing
      "Auth-Mock-Code": code,
    },
  });
}

async function handleLoginPost(
  req: Request,
  option?: { store?: Store },
): Promise<Response> {
  const formData = await req.formData();

  const code = formData.get("code");
  if (typeof code !== "string") {
    return errorMessage("Invalid code", code);
  }

  const store = option?.store ?? defaulStore;

  const loginSession = store.loginSessions.get(code);
  if (loginSession === undefined) {
    return errorMessage(code, `Login session not found for code: "${code}"`);
  }
  store.loginSessions.delete(code);

  const { clientId, redirectUri, codeChallenge, scope } = loginSession;

  const googleAuthIdTokenSub = formData.get("google_auth_id_token_sub");
  if (typeof googleAuthIdTokenSub !== "string") {
    return errorMessage(
      "Invalid google_auth_id_token_sub",
      googleAuthIdTokenSub,
    );
  }

  store.authSessions.set(code, {
    sub: googleAuthIdTokenSub,
    codeChallenge: codeChallenge,
    clientId: clientId,
    redirectUri: redirectUri,
    scope: scope,
  });

  const forwardedParamNames = ["state", "code", "scope", "authUser", "prompt"];

  const forwardedParams = Object.fromEntries(
    Object.entries(loginSession).filter(
      ([key, value]) =>
        forwardedParamNames.includes(key) && typeof value === "string",
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

export async function googleLogin(
  req: Request,
  option?: { store?: Store },
): Promise<Response> {
  if (req.method === "GET") {
    return handleLoginGet(req, option);
  }

  if (req.method === "POST") {
    return await handleLoginPost(req, option);
  }

  return new Response(null, { status: 400 });
}
