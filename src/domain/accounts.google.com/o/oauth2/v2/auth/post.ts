import { db, errorMessage, getStringFormData } from "@util/index.ts";

export async function handle(req: Request): Promise<Response> {
  const searchParams = new URL(req.url).searchParams;

  const formRedirectUrl = searchParams.get("redirect_uri") ?? null;
  if (formRedirectUrl === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const formData = await getStringFormData(req);

  const code = crypto.randomUUID();

  db.query(
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
  ).run({
    code,
    userSub: formData.get("user_sub") ?? null,
    clientId: searchParams.get("client_id") ?? null,
    scope: searchParams.get("scope") ?? null,
    codeChallengeMethod: searchParams.get("code_challenge_method") ?? null,
    codeChallengeValue: searchParams.get("code_challenge") ?? null,
  });

  const redirectUrl = new URL(formRedirectUrl);
  redirectUrl.searchParams.set("code", code);

  for (const key of ["state", "scope", "prompt"]) {
    const value = searchParams.get(key);
    if (value !== null) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  return Response.redirect(redirectUrl, 303);
}
