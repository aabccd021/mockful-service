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
        $code,
        $userSub,
        $clientId,
        $scope,
        $codeChallengeMethod,
        $codeChallengeValue
      )
    `,
    )
    .run({
      code,
      userSub: formData.get("user_sub") ?? null,
      clientId: searchParams.get("client_id") ?? null,
      scope: searchParams.get("scope") ?? null,
      codeChallengeMethod: searchParams.get("code_challenge_method") ?? null,
      codeChallengeValue: searchParams.get("code_challenge") ?? null,
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
