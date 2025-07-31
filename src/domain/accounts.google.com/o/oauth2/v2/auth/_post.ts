import { db, errorMessage, getStringFormData } from "@util/index.ts";

export async function handle(req: Request): Promise<Response> {
  const formData = await getStringFormData(req);

  const formRedirectUrl = formData.get("redirect_uri") ?? null;
  if (formRedirectUrl === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const code = crypto.randomUUID();

  db.query(
    `
        INSERT INTO google_auth_session (
          code,
          user,
          client_id,
          scope,
          code_challenge_method,
          code_challenge
        )
        VALUES (
          $code,
          $user,
          $clientId,
          $scope,
          $codeChallengeMethod,
          $codeChallengeValue
        )`,
  ).run({
    code,
    user: formData.get("user") ?? null,
    clientId: formData.get("client_id") ?? null,
    scope: formData.get("scope") ?? null,
    codeChallengeMethod: formData.get("code_challenge_method") ?? null,
    codeChallengeValue: formData.get("code_challenge") ?? null,
  });

  const redirectUrl = new URL(formRedirectUrl);
  redirectUrl.searchParams.set("code", code);

  for (const key of ["state", "scope", "prompt"]) {
    const value = formData.get(key);
    if (value !== undefined) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  return Response.redirect(redirectUrl, 303);
}
