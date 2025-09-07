import type { Context } from "@src/util.ts";

export async function handle(ctx: Context): Promise<Response> {
  const searchParams = new URL(ctx.req.url).searchParams;

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    throw new Error("Missing required parameter: redirect_uri");
  }

  const formData = await ctx.req.formData();
  const stringFormData = new Map(formData.entries());

  const code = crypto.randomUUID();

  ctx.db
    .query(
      `
    INSERT INTO google_auth_session (
        code,
        user_sub,
        client_id,
        scope,
        code_challenge_method,
        code_challenge
      )
      VALUES (
        :code,
        :user_sub,
        :client_id,
        :scope,
        :code_challenge_method,
        :code_challenge_value
      )
    `,
    )
    .run({
      code,
      user_sub: stringFormData.get("user_sub") ?? null,
      client_id: searchParams.get("client_id"),
      scope: searchParams.get("scope"),
      code_challenge_method: searchParams.get("code_challenge_method"),
      code_challenge_value: searchParams.get("code_challenge"),
    });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("code", code);

  for (const key of ["state", "scope", "prompt"]) {
    const value = searchParams.get(key);
    if (value !== null) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  return Response.redirect(redirectUrl, 303);
}
