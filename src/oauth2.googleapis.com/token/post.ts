import type * as sqlite from "bun:sqlite";
import type { Context } from "@util";
import { getStringFormData } from "@util";

type AuthSession = {
  client_id: string;
  scope: string;
  code_challenge: string | null;
  code_challenge_method: "S256" | "plain" | null;
  user_sub: string;
  user_email: string;
  user_email_verified: "true" | "false" | null;
};

function emailVerifiedToBoolean(value: "true" | "false" | null): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === null) {
    throw new Error("Scope 'email' is used but email_verified is null.");
  }
  value satisfies never;
  throw new Error(`Unreachable email_verified value: ${value}`);
}

async function createIdToken(authSession: AuthSession, accessToken: string) {
  const scopes = authSession.scope.split(" ");
  if (!scopes.includes("openid")) {
    return undefined;

  }  

  const atHashRaw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(accessToken));
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
    aud: authSession.client_id,
    iat: nowEpoch,
    exp: nowEpoch + 3600,
    at_hash: atHash,
    sub: authSession.user_sub,
    email: scopes.includes("email") ? authSession.user_email : undefined,
    email_verified: scopes.includes("email")
      ? emailVerifiedToBoolean(authSession.user_email_verified)
      : undefined,
  };

  const payloadStr = new TextEncoder()
    .encode(JSON.stringify(payload))
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const signature = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${headerStr}.${payloadStr}`));

  const signatureStr = new Uint8Array(signature).toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

export async function handle(ctx: Context): Promise<Response> {
  const formData = await getStringFormData(ctx);

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

  const authHeader = ctx.req.headers.get("Authorization");
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

  const [clientIdRaw, clientSecretRaw] = atob(credentials).split(":");

  if (clientIdRaw === undefined || clientIdRaw === "") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "Could not determine client ID from request.",
      },
      { status: 400 },
    );
  }

  const clientId = decodeURIComponent(clientIdRaw);

  if (clientSecretRaw === undefined || clientSecretRaw === "") {
    return Response.json(
      {
        error: "invalid_request",
        error_description: "client_secret is missing.",
      },
      { status: 400 },
    );
  }

  const clientSecret = decodeURIComponent(clientSecretRaw);

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

  const authSession = ctx.db
    .query<AuthSession, sqlite.SQLQueryBindings>(
      `
        SELECT 
          s.client_id,
          s.scope,
          s.code_challenge,
          s.code_challenge_method,
          s.user_sub,
          u.email AS user_email,
          u.email_verified AS user_email_verified
        FROM google_auth_session s
        JOIN google_auth_user u 
          ON s.user_sub = u.sub
        WHERE code = $code
      `,
    )
    .get({ code });
  ctx.db.query("DELETE FROM google_auth_session WHERE code = $code").run({ code });

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

    const codeChallengeMethod: "S256" | "plain" = authSession.code_challenge_method ?? "plain";

    if (codeChallengeMethod === "plain") {
      if (authSession.code_challenge !== codeVerifier) {
        return Response.json(
          {
            error: "invalid_grant",
            error_description: "Invalid code verifier.",
          },
          { status: 400 },
        );
      }
    } else if (codeChallengeMethod === "S256") {
      const hashBinary = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
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
      codeChallengeMethod satisfies never;
      throw new Error(`Unreachable code_challenge_method value: ${codeChallengeMethod}`);
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

  const redirectUris = ctx.db
    .query<{ value: string }, sqlite.SQLQueryBindings>(
      "SELECT value FROM google_auth_redirect_uri WHERE client_id = $clientId",
    )
    .all({ clientId: clientId });

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

  const clients = ctx.db
    .query<{ secret: string }, sqlite.SQLQueryBindings>(
      "SELECT secret FROM google_auth_client WHERE id = $id",
    )
    .all({ id: clientId });

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

  const accessToken = crypto.randomUUID();

  const idToken = await createIdToken(authSession, accessToken);

  const responseBody: Record<string, string | number | undefined> = {
    id_token: idToken,
    access_token: accessToken,
    scope: authSession.scope,
    token_type: "Bearer",
    expires_in: 3599,
  };

  return Response.json(responseBody, { status: 200 });
}
