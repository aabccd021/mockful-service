import type { Context } from "@src/util";

export async function handle(ctx: Context): Promise<Response> {
  return Response.json({
      issuer: `${ctx.urlPrefix}https://accounts.google.com`,
      token_endpoint: `${ctx.urlPrefix}https://oauth2.googleapis.com/token`,
      authorization_endpoint: `${ctx.urlPrefix}https://accounts.google.com/o/oauth2/v2/auth`,
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
      subject_types_supported: [
        "public"
      ],
      id_token_signing_alg_values_supported: [
        "RS256"
      ],
  }, { status: 200 }
  )
}
