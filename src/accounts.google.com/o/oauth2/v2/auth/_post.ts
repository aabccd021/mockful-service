import { type Context, errorMessage, getStringFormData } from "@util.ts";

export async function handle(req: Request, ctx: Context): Promise<Response> {
  const formData = await getStringFormData(req);

  const redirectUri = formData.get("redirect_uri") ?? null;
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const code = crypto.randomUUID();

  ctx.db
    .query(
      `
        INSERT INTO google_auth_session (
          code,
          user,
          client_id,
          redirect_uri,
          scope,
          code_challenge_method,
          code_challenge
        )
        VALUES (
          $code,
          $user,
          $clientId,
          $redirectUri,
          $scope,
          $codeChallengeMethod,
          $codeChallengeValue
        )`,
    )
    .run({
      code,
      redirectUri,
      user: formData.get("user") ?? null,
      clientId: formData.get("client_id") ?? null,
      scope: formData.get("scope") ?? null,
      codeChallengeMethod: formData.get("code_challenge_method") ?? null,
      codeChallengeValue: formData.get("code_challenge") ?? null,
    });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("code", code);

  for (const key of ["state", "scope", "prompt"]) {
    const value = formData.get(key);
    if (value !== undefined) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: redirectUrl.toString() },
  });
}
