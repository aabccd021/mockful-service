import { db, getStringFormData } from "@util/index.ts";
import * as v from "valibot";

const GoogleAuthUser = v.object({
  email: v.string(),
  email_verified: v.nullable(v.union([v.literal("true"), v.literal("false")])),
});

export type GoogleAuthUser = v.InferInput<typeof GoogleAuthUser>;

const AuthSession = v.object({
  client_id: v.string(),
  scope: v.nullable(v.string()),
  user: v.string(),
  code_challenge: v.nullable(v.string()),
  code_challenge_method: v.nullable(v.union([v.literal("S256"), v.literal("plain")])),
});

const NullableAuthSession = v.nullable(AuthSession);

type AuthSession = v.InferInput<typeof AuthSession>;

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
  throw new Error(`Invalid boolean value: ${value}. Expected "true" or "false".`);
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
  _req: Request,
  authSession: AuthSession,
  accessToken: string,
  scopeStr: string,
): string | undefined {
  const scopes = scopeStr.split(" ");
  if (!scopes.includes("openid")) {
    return undefined;
  }

  const sub = authSession.user;

  const user = db
    .query("SELECT email,email_verified FROM google_auth_user WHERE sub = $sub")
    .get({ sub });
  v.assert(GoogleAuthUser, user);

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

  const signature = new Bun.CryptoHasher("sha256").update(`${headerStr}.${payloadStr}`).digest();

  const signatureStr = new Uint8Array(signature).toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

export async function handle(req: Request): Promise<Response> {
  const formData = await getStringFormData(req);

  const grantType = formData.get("grant_type") ?? "";
  if (grantType !== "authorization_code") {
    return Response.json(
      {
        error: "unsupported_grant_type",
        error_description: `Invalid grant_type: ${grantType}`,
      },
      { status: 400 },
    );
  }

  const redirectUri = formData.get("redirect_uri");
  if (redirectUri === undefined) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing parameter: redirect_uri",
      },
      { status: 400 },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader === null) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Could not determine client ID from request.",
      },
      { status: 400 },
    );
  }

  const [prefix, credentials] = authHeader.split(" ");

  if (prefix === undefined) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Could not determine client ID from request.",
      },
      { status: 400 },
    );
  }

  if (prefix !== "Basic") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Could not determine client ID from request.",
      },
      { status: 400 },
    );
  }

  if (credentials === undefined) {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Bad Request",
      },
      { status: 400 },
    );
  }

  const [clientId, clientSecret] = atob(credentials).split(":");

  if (clientId === undefined || clientId === "") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Could not determine client ID from request.",
      },
      { status: 400 },
    );
  }

  if (clientSecret === undefined || clientSecret === "") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "client_secret is missing.",
      },
      { status: 400 },
    );
  }

  const code = formData.get("code");
  if (code === undefined || code === "") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Missing required parameter: code",
      },
      { status: 400 },
    );
  }

  const authSession = db
    .query("SELECT * FROM google_auth_session WHERE code = $code")
    .get({ code });
  db.query("DELETE FROM google_auth_session WHERE code = $code").run({ code });

  v.assert(NullableAuthSession, authSession);
  if (authSession === null) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Malformed auth code.",
      },
      { status: 400 },
    );
  }

  if (authSession.code_challenge !== null) {
    const codeVerifier = formData.get("code_verifier");
    if (codeVerifier === undefined) {
      return Response.json(
        {
          error: "invalid_grant",
          error_description: "Missing code verifier.",
        },
        { status: 400 },
      );
    }

    const code_challengeMethod: "S256" | "plain" = authSession.code_challenge_method ?? "plain";

    if (code_challengeMethod === "plain") {
      if (authSession.code_challenge !== codeVerifier) {
        return Response.json(
          {
            error: "invalid_grant",
            error_description: "Invalid code verifier.",
          },
          { status: 400 },
        );
      }
    } else if (code_challengeMethod === "S256") {
      const hashBinary = new Bun.CryptoHasher("sha256").update(codeVerifier).digest();
      const codeVerifierHash = new Uint8Array(hashBinary).toBase64({
        alphabet: "base64url",
        omitPadding: true,
      });
      if (authSession.code_challenge !== codeVerifierHash) {
        return Response.json(
          {
            error: "invalid_grant",
            error_description: "Invalid code verifier.",
          },
          { status: 400 },
        );
      }
    } else {
      code_challengeMethod satisfies never;
      throw new Error(`Unknown code_challenge_method: ${code_challengeMethod}`);
    }
  }

  if (clientId !== authSession.client_id) {
    return Response.json(
      {
        error: "invalid_client",
        error_description: "The OAuth client was not found.",
      },
      { status: 401 },
    );
  }

  const redirectUris = db
    .query("SELECT value FROM google_auth_redirect_uri WHERE client_id = $clientId")
    .all({ clientId: clientId });
  v.assert(v.array(v.object({ value: v.string() })), redirectUris);

  const validRedirectUris = redirectUris.map((r) => r.value);
  if (!validRedirectUris.includes(redirectUri)) {
    return Response.json(
      {
        error: "redirect_uri_mismatch",
        error_description: "Bad Request",
      },
      { status: 400 },
    );
  }

  const clients = db
    .query("SELECT secret FROM google_auth_client WHERE id = $id")
    .all({ id: clientId });
  v.assert(
    v.array(
      v.object({
        secret: v.string(),
      }),
    ),
    clients,
  );

  const isSecretValid = clients.map((c) => c.secret).includes(clientSecret);
  if (!isSecretValid) {
    return Response.json(
      {
        error: "invalid_client",
        error_description: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const scopeStr = authSession.scope ?? "";

  const accessToken = crypto.randomUUID();

  const idToken = generateGoogleIdToken(req, authSession, accessToken, scopeStr);

  const responseBody: Record<string, string | number | undefined> = {
    id_token: idToken,
    access_token: accessToken,
    scope: scopeStr,
    token_type: "Bearer",
    expires_in: 3599,
  };

  return Response.json(responseBody, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
