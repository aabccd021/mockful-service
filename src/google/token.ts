import {
  assert,
  enums,
  type Infer,
  nullable,
  object,
  string,
  type,
} from "superstruct";
import { type Context, errorMessage, getStringFormData } from "../util.ts";

const GoogleAuthUser = object({
  email: string(),
  email_verified: nullable(enums(["true", "false"])),
});

const Client = object({
  secret: string(),
});

export type GoogleAuthUser = Infer<typeof GoogleAuthUser>;

const AuthSession = type({
  client_id: string(),
  redirect_uri: string(),
  scope: nullable(string()),
  user: string(),
  code_challenge: nullable(string()),
  code_challenge_method: nullable(enums(["S256", "plain"])),
});

const NullableAuthSession = nullable(AuthSession);

type AuthSession = Infer<typeof AuthSession>;

function serializeBoolean(value: "true" | "false" | null): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === null) {
    throw new Error("User email_verified is required for email scope.");
  }
  value satisfies never;
  throw new Error(
    `Invalid boolean value: ${value}. Expected "true" or "false".`,
  );
}

function getEmailScopeData(
  scopes: string[],
  user: GoogleAuthUser,
):
  | undefined
  | {
      email: string;
      email_verified: boolean;
    } {
  if (!scopes.includes("email")) {
    return undefined;
  }
  return {
    email: user.email,
    email_verified: serializeBoolean(user.email_verified),
  };
}

function generateGoogleIdToken(
  ctx: Context,
  authSession: AuthSession,
  accessToken: string,
  scopeStr: string,
): string | undefined {
  const scopes = scopeStr.split(" ");
  if (!scopes.includes("openid")) {
    return undefined;
  }

  const sub = authSession.user;

  const user = ctx.db
    .query("SELECT email,email_verified FROM google_auth_user WHERE sub = $sub")
    .get({ sub });
  assert(user, GoogleAuthUser);

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
    ...getEmailScopeData(scopes, user),
    iss: "https://accounts.google.com",
    aud: authSession.client_id,
    iat: nowEpoch,
    exp: nowEpoch + 3600,
    at_hash: atHash,
    sub,
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

export async function handle(req: Request, ctx: Context): Promise<Response> {
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

  const authSession = ctx.db
    .query("SELECT * FROM google_auth_session WHERE code = $code")
    .get({ code });

  assert(authSession, NullableAuthSession);

  if (authSession === null) {
    return errorMessage(`Auth session not found for code: "${code}".`);
  }

  ctx.db
    .query("DELETE FROM google_auth_session WHERE code = $code")
    .run({ code });

  if (authSession.code_challenge !== null) {
    const codeVerifier = formData.get("code_verifier");
    if (codeVerifier === undefined) {
      return errorMessage("Parameter code_verifier is required.");
    }

    const code_challengeMethod: "S256" | "plain" =
      authSession.code_challenge_method ?? "plain";

    if (code_challengeMethod === "plain") {
      if (authSession.code_challenge !== codeVerifier) {
        return errorMessage("Code verifier does not match code challenge.");
      }
    } else if (code_challengeMethod === "S256") {
      const hashBinary = new Bun.CryptoHasher("sha256")
        .update(codeVerifier)
        .digest();
      const codeVerifierHash = new Uint8Array(hashBinary).toBase64({
        alphabet: "base64url",
        omitPadding: true,
      });
      if (authSession.code_challenge !== codeVerifierHash) {
        return errorMessage("Code verifier does not match code challenge.");
      }
    } else {
      code_challengeMethod satisfies never;
      throw new Error(`Unknown code_challenge_method: ${code_challengeMethod}`);
    }
  }

  if (formData.get("redirect_uri") !== authSession.redirect_uri) {
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

  if (clientId !== authSession.client_id) {
    return errorMessage("Invalid client_id");
  }

  const client = ctx.db
    .query("SELECT secret FROM google_auth_client WHERE id = $id")
    .get({ id: clientId });
  assert(client, Client);

  if (clientSecret !== client.secret) {
    return errorMessage(
      `Invalid client_secret. Expected "${client.secret}", got "${clientSecret}".`,
    );
  }

  const scopeStr = authSession.scope;
  if (scopeStr === null) {
    return errorMessage("scope is required.");
  }

  const accessToken = crypto.randomUUID();

  const idToken = generateGoogleIdToken(
    ctx,
    authSession,
    accessToken,
    scopeStr,
  );

  const responseBody: Record<string, string | number | undefined> = {
    id_token: idToken,
    access_token: accessToken,
    scope: scopeStr,
    token_type: "Bearer",
    expires_in: 3599,
  };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
