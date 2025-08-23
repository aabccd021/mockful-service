import type { Context } from "@src/util";

const json = {
  issuer: "https://accounts.google.com",
  authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  device_authorization_endpoint: "https://oauth2.googleapis.com/device/code",
  token_endpoint: "https://oauth2.googleapis.com/token",
  userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  revocation_endpoint: "https://oauth2.googleapis.com/revoke",
  jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
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
};

export async function handle(ctx: Context): Promise<Response> {
  return Response.json({
    ...json,
    issuer: ctx.urlPrefix + json.issuer,
    authorization_endpoint: ctx.urlPrefix + json.authorization_endpoint,
    device_authorization_endpoint: ctx.urlPrefix + json.device_authorization_endpoint,
    token_endpoint: ctx.urlPrefix + json.token_endpoint,
    userinfo_endpoint: ctx.urlPrefix + json.userinfo_endpoint,
    revocation_endpoint: ctx.urlPrefix + json.revocation_endpoint,
    jwks_uri: ctx.urlPrefix + json.jwks_uri,
  }, { status: 200 });
}
