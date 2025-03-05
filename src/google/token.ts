import { Database } from "bun:sqlite";
import { parseArgs } from "node:util";
import type { Server } from "bun";
import { assert, enums, nullable, object, string } from "superstruct";
import { errorMessage } from "../util.ts";

const db = new Database(":memory:");

const AuthSession = nullable(
  object({
    code: string(),
    clientId: string(),
    redirectUri: string(),
    state: nullable(string()),
    scope: nullable(string()),
    sub: string(),
  }),
);

const CodeChallenge = nullable(
  object({
    method: enums(["S256", "plain"]),
    value: string(),
  }),
);

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

async function fetch(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

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

  if (code instanceof File) {
    return errorMessage('Invalid code type: "file". Expected "string".');
  }

  const authSession = db
    .query("SELECT * FROM auth_sessions WHERE code = $code")
    .get({ code });
  assert(authSession, AuthSession);

  if (authSession === null) {
    console.error(`Auth session not found for code: "${code}"`);
    return new Response(null, { status: 400 });
  }

  const codeChallenge = db
    .query(
      "SELECT * FROM auth_session_code_challenge WHERE auth_session_code = $auth_session_code",
    )
    .get({ auth_session_code: code });
  assert(codeChallenge, CodeChallenge);

  db.query("DELETE FROM auth_sessions WHERE code = $code").run({ code });

  if (codeChallenge?.method === "S256") {
    const codeVerifier = formData.get("code_verifier");

    if (codeVerifier === null) {
      return errorMessage("Parameter code_verifier is required.");
    }

    if (codeVerifier instanceof File) {
      return errorMessage(
        'Invalid code_verifier type: "file". Expected "string".',
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

    if (codeChallenge.value !== expectedCodeChallenge) {
      return errorMessage(
        "Hash of code_verifier does not match code_challenge.",
        `code_verifier: "${codeVerifier}".`,
        `code_challenge: "${codeChallenge.value}".`,
      );
    }
  }

  const redirectUri = formData.get("redirect_uri");

  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  if (redirectUri instanceof File) {
    return errorMessage(
      'Invalid redirect_uri type: "file". Expected "string".',
    );
  }

  if (redirectUri !== authSession.redirectUri) {
    return errorMessage(
      `Invalid redirect_uri: "${redirectUri}".`,
      `Expected "${authSession.redirectUri}".`,
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    return errorMessage("Authorization header is required.");
  }

  const [prefix, credentials] = authHeader.split(" ");
  if (prefix !== "Basic") {
    return errorMessage(
      `Invalid Authorization header prefix: "${prefix}".`,
      `Expected "Basic".`,
    );
  }

  if (credentials === undefined) {
    return errorMessage("Credentials not found in Authorization header.");
  }

  const [clientId, clientSecret] = atob(credentials).split(":");

  if (clientId !== authSession.clientId) {
    return errorMessage(
      `Invalid client_id: "${clientId}".`,
      `Expected "${authSession.clientId}".`,
    );
  }

  if (clientSecret !== "mock_client_secret") {
    return errorMessage(
      `Invalid client_secret. Expected "mock_client_secret".`,
      "Never use production client_secret in tests.",
    );
  }

  const scopes = authSession.scope?.split(" ") ?? [];

  const idToken = scopes.includes("openid")
    ? generateGoogleIdToken(clientId, authSession.sub)
    : undefined;

  const responseBody: Record<string, string | number | undefined> = {
    id_token: idToken,
    access_token: "mock_access_token",
    scope: authSession.scope ?? undefined,
    token_type: "Bearer",
    expires_in: 3600,
  };

  const cleanResponseBody = Object.fromEntries(
    Object.entries(responseBody).filter(([_, value]) => value !== undefined),
  );

  return new Response(JSON.stringify(cleanResponseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function serve(args: string[]): Server {
  const arg = parseArgs({
    args,
    options: {
      port: {
        type: "string",
        alias: "p",
      },
    },
  });

  const port =
    arg.values.port !== undefined ? Number(arg.values.port) : undefined;

  return Bun.serve({ port, fetch });
}
