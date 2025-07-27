import { array, assert, object, string } from "superstruct";
import { type Context, errorMessage, getStringFormData } from "../util.ts";

const Users = array(
  object({
    sub: string(),
    email: string(),
  }),
);

function handleGet(req: Request, ctx: Context): Response {
  const searchParams = new URL(req.url).searchParams;

  const paramInputs = searchParams
    .entries()
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${name}" value="${value}" />`,
    );
  const paramInputsStr = Array.from(paramInputs).join("");

  const responseType = searchParams.get("response_type");
  if (responseType !== "code") {
    return errorMessage(
      `Invalid response_type: "${responseType}".`,
      `Expected "code".`,
    );
  }

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const redirectHost = new URL(redirectUri).host;

  const users = ctx.db.query(`SELECT sub,email FROM google_auth_user`).all();
  assert(users, Users);

  const userSubmitButton = users
    .map(
      (user) =>
        `<button style="height: 2rem" type="submit" name="user" value="${user.sub}">${user.email}</button>`,
    )
    .join("");

  const loginForm = `
    <html lang="en">
      <head>
        <title>Google Login</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
      </head>
      <body style="max-width: 30rem">
          <h1>Choose an account</h1>
          <p>to continue to ${redirectHost}</p>
          <form method="post" style="display: flex; flex-direction: column; gap: 1rem;">
            ${paramInputsStr} 
            ${userSubmitButton} 
          </form>
      </body>
    </html>
  `;
  return new Response(loginForm, {
    headers: {
      "content-type": "text/html",
    },
  });
}

async function handlePost(req: Request, { db }: Context): Promise<Response> {
  const formData = await getStringFormData(req);

  const redirectUri = formData.get("redirect_uri") ?? null;
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const code = crypto.randomUUID();

  try {
    db.query(
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
    ).run({
      code,
      redirectUri,
      user: formData.get("user") ?? null,
      clientId: formData.get("client_id") ?? null,
      scope: formData.get("scope") ?? null,
      codeChallengeMethod: formData.get("code_challenge_method") ?? null,
      codeChallengeValue: formData.get("code_challenge") ?? null,
    });
  } catch (err) {
    console.error(err);
    return errorMessage("Failed to store login session.");
  }

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

export async function handle(req: Request, ctx: Context): Promise<Response> {
  if (req.method === "GET") {
    return handleGet(req, ctx);
  }

  if (req.method === "POST") {
    return await handlePost(req, ctx);
  }

  return new Response("Method Not Allowed", { status: 405 });
}
