import type * as sqlite from "bun:sqlite";
import type { Context } from "@util";
import { getStringFormData } from "@util";

type AuthSession = {
  readonly client_id: string;
  readonly scope: string;
  readonly code_challenge: string | null;
  readonly code_challenge_method: "S256" | "plain" | null;
  readonly user_sub: string;
  readonly user_email: string;
  readonly user_email_verified: "true" | "false" | null;
};

type Client = {
  readonly id: string;
  readonly secret: string;
};

function getClientFromBasicAuth(ctx: Context): [undefined, Client] | [Response] {
  const authHeader = ctx.req.headers.get("Authorization");
  if (authHeader === null) {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "Could not determine client ID from request.",
        },
        { status: 400 },
      ),
    ];
  }

  const [prefix, credentials] = authHeader.split(" ");

  if (prefix === undefined) {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "Could not determine client ID from request.",
        },
        { status: 400 },
      ),
    ];
  }

  if (prefix !== "Basic") {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "Could not determine client ID from request.",
        },
        { status: 400 },
      ),
    ];
  }

  if (credentials === undefined) {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "Bad Request",
        },
        { status: 400 },
      ),
    ];
  }

  const [idRaw, secretRaw] = atob(credentials).split(":");

  if (idRaw === undefined || idRaw === "") {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "Could not determine client ID from request.",
        },
        { status: 400 },
      ),
    ];
  }
  const id = decodeURIComponent(idRaw);

  if (secretRaw === undefined || secretRaw === "") {
    return [
      Response.json(
        {
          error: "invalid_request",
          error_description: "client_secret is missing.",
        },
        { status: 400 },
      ),
    ];
  }
  const secret = decodeURIComponent(secretRaw);

  return [undefined, { id, secret }];
}

async function createIdToken(authSession: AuthSession, accessToken: string) {
  const scopes = authSession.scope.split(" ");
  if (!scopes.includes("openid")) {
    return undefined;
  }

  const atHashRaw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(accessToken));
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

  let email_verified: boolean | undefined;
  if (authSession.user_email_verified === "true") {
    email_verified = true;
  } else if (authSession.user_email_verified === "false") {
    email_verified = false;
  }

  const payload = {
    iss: "https://accounts.google.com",
    aud: authSession.client_id,
    iat: nowEpoch,
    exp: nowEpoch + 3600,
    at_hash: atHash,
    sub: authSession.user_sub,
    email: scopes.includes("email") ? authSession.user_email : undefined,
    email_verified,
  };

  const payloadStr = new TextEncoder()
    .encode(JSON.stringify(payload))
    .toBase64({ alphabet: "base64url", omitPadding: true });

  const signature = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${headerStr}.${payloadStr}`),
  );

  const signatureStr = new Uint8Array(signature).toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

async function validateCodeChallenge(args: {
  codeChallenge: string;
  codeVerifier: string | undefined;
  codeChallengeMethod: "S256" | "plain" | null;
}): Promise<Response | undefined> {
  const codeVerifier = args.codeVerifier;
  if (codeVerifier === undefined) {
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Missing code verifier.",
      },
      { status: 400 },
    );
  }

  const codeChallengeMethod: "S256" | "plain" = args.codeChallengeMethod ?? "plain";

  if (codeChallengeMethod === "plain") {
    if (args.codeChallenge === codeVerifier) {
      return undefined;
    }
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Invalid code verifier.",
      },
      { status: 400 },
    );
  }

  if (codeChallengeMethod === "S256") {
    const codeVerifierHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier),
    );
    const codeVerifierHashStr = new Uint8Array(codeVerifierHash).toBase64({
      alphabet: "base64url",
      omitPadding: true,
    });
    if (args.codeChallenge === codeVerifierHashStr) {
      return undefined;
    }
    return Response.json(
      {
        error: "invalid_grant",
        error_description: "Invalid code verifier.",
      },
      { status: 400 },
    );
  }

  codeChallengeMethod satisfies never;
  throw new Error(`Unreachable code_challenge_method value: ${codeChallengeMethod}`);
}

export async function handle(ctx: Context): Promise<Response> {
  const formData = await getStringFormData(ctx);

  const [authErrorResponse, client] = getClientFromBasicAuth(ctx);
  if (authErrorResponse !== undefined) {
    return authErrorResponse;
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

  if (client.id !== authSession.client_id) {
    return Response.json(
      {
        error: "invalid_client",
        error_description: "The OAuth client was not found.",
      },
      { status: 401 },
    );
  }

  if (authSession.code_challenge !== null) {
    const validationErrorResponse = await validateCodeChallenge({
      codeChallenge: authSession.code_challenge,
      codeChallengeMethod: authSession.code_challenge_method,
      codeVerifier: formData.get("code_verifier"),
    });
    if (validationErrorResponse !== undefined) {
      return validationErrorResponse;
    }
  }

  const validRedirectUris = ctx.db
    .query(
      `
        SELECT * 
        FROM google_auth_redirect_uri 
        WHERE client_id = :clientId
          AND value = :redirectUri
      `,
    )
    .all({ clientId: client.id, redirectUri: redirectUri });

  if (validRedirectUris.length !== 1) {
    return Response.json(
      {
        error: "redirect_uri_mismatch",
        error_description: "Bad Request",
      },
      { status: 400 },
    );
  }

  const validSecrets = ctx.db
    .query("SELECT * FROM google_auth_client WHERE id = :id AND secret = :secret")
    .all({ id: client.id, secret: client.secret });

  if (validSecrets.length !== 1) {
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
