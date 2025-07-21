import {
  assertNever,
  type Context,
  errorMessage,
  getStringFormData,
} from "../util.ts";

export type AuthSession = {
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope?: string;
  readonly sub?: string;
  readonly email?: string;
  readonly emailVerified?: boolean;
  readonly codeChallenge?: string;
  readonly codeChallengeMethod?: "S256" | "plain";
};

type AuthData = Pick<AuthSession, "sub" | "email" | "emailVerified">;

function generateGoogleIdToken(
  clientId: string,
  authSession: AuthData,
  accessToken: string,
): string | undefined {
  const atHashRaw = new Bun.CryptoHasher("sha256").update(accessToken).digest();
  const atHash = new Uint8Array(atHashRaw)
    .slice(0, 16)
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const header = {
    alg: "RS256",
    typ: "JWT",
    // kid: "todo",
  };

  const headerStr = new TextEncoder()
    .encode(JSON.stringify(header))
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const nowEpoch = Math.floor(Date.now() / 1000);

  const payload = {
    iss: "https://accounts.google.com",
    aud: clientId,
    iat: nowEpoch,
    exp: nowEpoch + 3600,
    at_hash: atHash,
    sub: authSession.sub,
    email: authSession.email,
    email_verified: authSession.emailVerified,
  };

  const payloadStr = new TextEncoder()
    .encode(JSON.stringify(payload))
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const signature = new Bun.CryptoHasher("sha256")
    .update(`${headerStr}.${payloadStr}`)
    .digest();

  const signatureStr = new Uint8Array(signature).toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

function decodeAuthSession(authSession: unknown): AuthSession | null {
  if (authSession === null) {
    return null;
  }
  if (typeof authSession !== "object") {
    throw new Error("Absurd authSession: not an object");
  }

  const clientId =
    "client_id" in authSession && typeof authSession.client_id === "string"
      ? authSession.client_id
      : null;
  if (clientId === null) {
    throw new Error("Absurd clientId: null");
  }

  const redirectUri =
    "redirect_uri" in authSession &&
    typeof authSession.redirect_uri === "string"
      ? authSession.redirect_uri
      : null;
  if (redirectUri === null) {
    throw new Error("Absurd redirectUri: null");
  }

  const scope =
    "scope" in authSession && typeof authSession.scope === "string"
      ? authSession.scope
      : undefined;

  const sub =
    "sub" in authSession && typeof authSession.sub === "string"
      ? authSession.sub
      : undefined;

  const codeChallenge =
    "code_challenge" in authSession &&
    typeof authSession.code_challenge === "string"
      ? authSession.code_challenge
      : undefined;

  const codeChallengeMethod =
    "code_challenge_method" in authSession
      ? authSession.code_challenge_method
      : undefined;

  if (
    codeChallengeMethod !== "S256" &&
    codeChallengeMethod !== "plain" &&
    codeChallengeMethod !== null
  ) {
    throw new Error("Absurd codeChallengeMethodObj: invalid value");
  }

  const email =
    "email" in authSession && typeof authSession.email === "string"
      ? authSession.email
      : undefined;

  const emailVerified =
    "email_verified" in authSession &&
    (authSession.email_verified === "true"
      ? true
      : authSession.email_verified === "false"
        ? false
        : undefined);

  console.log({ emailVerified, authSession });

  return {
    clientId,
    redirectUri,
    scope,
    sub,
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod ?? undefined,
    email,
    emailVerified,
  };
}

export async function handle(req: Request, { db }: Context): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  const formData = await getStringFormData(req);

  const grantType = formData.get("grant_type");
  if (grantType === undefined) {
    return errorMessage("Parameter grant_type is required.");
  }
  if (grantType !== "authorization_code") {
    return errorMessage(
      `Invalid grant_type: "${grantType}". Expected "authorization_code".`,
    );
  }

  const code = formData.get("code");
  if (code === undefined) {
    return errorMessage("Parameter code is required.");
  }

  const authSessionRaw = db
    .query("SELECT * FROM google_auth_session WHERE code = $code")
    .get({ code });

  const authSession = decodeAuthSession(authSessionRaw);
  if (authSession === null) {
    return errorMessage(`Auth session not found for code: "${code}".`);
  }

  db.query("DELETE FROM google_auth_session WHERE code = $code").run({ code });

  if (authSession.codeChallenge !== undefined) {
    const codeVerifier = formData.get("code_verifier");
    if (codeVerifier === undefined) {
      return errorMessage("Parameter code_verifier is required.");
    }

    const codeChallengeMethod: "S256" | "plain" =
      authSession.codeChallengeMethod ?? "plain";

    if (codeChallengeMethod === "plain") {
      if (authSession.codeChallenge !== codeVerifier) {
        return errorMessage("Code verifier does not match code challenge.");
      }
    } else if (codeChallengeMethod === "S256") {
      const hashBinary = new Bun.CryptoHasher("sha256")
        .update(codeVerifier)
        .digest();
      const codeVerifierHash = new Uint8Array(hashBinary).toBase64({
        alphabet: "base64url",
        omitPadding: true,
      });
      if (authSession.codeChallenge !== codeVerifierHash) {
        return errorMessage("Code verifier does not match code challenge.");
      }
    } else {
      assertNever(codeChallengeMethod);
    }
  }

  if (formData.get("redirect_uri") !== authSession.redirectUri) {
    return errorMessage("Invalid redirect_uri.");
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    return errorMessage("Authorization header is required.");
  }

  const [prefix, credentials] = authHeader.split(" ");

  if (prefix !== "Basic") {
    return errorMessage(
      `Invalid Authorization header prefix: "${prefix}". Expected "Basic".`,
    );
  }

  if (credentials === undefined) {
    return errorMessage("Credentials not found in Authorization header.");
  }

  const [clientId, clientSecret] = atob(credentials).split(":");

  if (clientId !== authSession.clientId) {
    return errorMessage("Invalid client_id");
  }

  if (clientSecret !== "mock_client_secret") {
    return errorMessage(
      `Invalid client_secret. Expected "mock_client_secret".`,
      "Never use production client_secret in tests.",
    );
  }

  const authSessionScope = authSession.scope;
  if (authSessionScope === undefined) {
    return errorMessage("scope is required.");
  }

  const accessToken = crypto.randomUUID();

  const scopes = authSessionScope.split(" ");
  const idToken = scopes.includes("openid")
    ? generateGoogleIdToken(clientId, authSession, accessToken)
    : undefined;

  const responseBody: Record<string, string | number | undefined> = {
    id_token: idToken,
    access_token: accessToken,
    scope: authSessionScope,
    token_type: "Bearer",
    expires_in: 3599,
  };

  const cleanResponseBody = Object.fromEntries(
    Object.entries(responseBody).filter(([_, value]) => value !== undefined),
  );

  return new Response(JSON.stringify(cleanResponseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
