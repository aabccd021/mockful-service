import type { Context } from "@util";
import { getStringFormData } from "@util";

export async function handle(ctx: Context): Promise<Response> {
  const searchParams = new URL(ctx.req.url).searchParams;

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    throw new Error("Missing required parameter: redirect_uri");
  }

  const formData = await getStringFormData(ctx);

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
      user_sub: formData.get("user_sub") ?? null,
      client_id: searchParams.get("client_id") ?? null,
      scope: searchParams.get("scope") ?? null,
      code_challenge_method: searchParams.get("code_challenge_method") ?? null,
      code_challenge_value: searchParams.get("code_challenge") ?? null,
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
