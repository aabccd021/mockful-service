import type { Context } from "@src/util";

export async function handle(ctx: Context): Promise<Response> {
  return Response.json(
    {
      issuer: `${ctx.urlPrefix}https://accounts.google.com`,
      authorization_endpoint: `${ctx.urlPrefix}https://accounts.google.com/o/oauth2/v2/auth`,
      device_authorization_endpoint: `${ctx.urlPrefix}https://oauth2.googleapis.com/device/code`,
      token_endpoint: `${ctx.urlPrefix}https://oauth2.googleapis.com/token`,
      userinfo_endpoint: `${ctx.urlPrefix}https://openidconnect.googleapis.com/v1/userinfo`,
      revocation_endpoint: `${ctx.urlPrefix}https://oauth2.googleapis.com/revoke`,
      jwks_uri: `${ctx.urlPrefix}https://www.googleapis.com/oauth2/v3/certs`,
      response_types_supported: [
        "code",
        "token",
        "id_token",
        "code token",
        "code id_token",
        "token id_token",
        "code token id_token",
        "none",
      ],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "email", "profile"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      claims_supported: [
        "aud",
        "email",
        "email_verified",
        "exp",
        "family_name",
        "given_name",
        "iat",
        "iss",
        "locale",
        "name",
        "picture",
        "sub",
      ],
      code_challenge_methods_supported: ["plain", "S256"],
    },
    { status: 200 },
  );
}
