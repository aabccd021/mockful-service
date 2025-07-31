import { db } from "@util/index.ts";
import { array, assert, object, string } from "superstruct";

const Users = array(
  object({
    sub: string(),
    email: string(),
  }),
);

const knownScopes = ["openid", "email"];

const knownChallengeMethods = ["S256", "plain"];

function page(body: string): Response {
  const pageContent = `
    <html lang="en">
      <head>
        <title>Sign In - Google Accounts</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
      </head>
      <body style="max-width: 30rem">
        ${body}
      </body>
    </html>
  `;
  return new Response(pageContent, {
    headers: {
      "content-type": "text/html",
    },
  });
}

// TODO: errors should be redirected to https://accounts.google.com/signin/oauth/error/v2 and pass
// each errors id with authError=xxx_error_id
export function handle(req: Request): Response {
  const searchParams = new URL(req.url).searchParams;

  const reqScope = searchParams.get("scope");
  if (reqScope === null) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const scopes = reqScope.split(" ");
  for (const scope of scopes) {
    if (!knownScopes.includes(scope)) {
      return page(`
        <h1>Access blocked: Authorization Error</h1>
        <p>Error 400: invalid_scope </p>
      `);
    }
  }

  const reqResponseType = searchParams.get("response_type");
  if (reqResponseType === null) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  if (reqResponseType !== "code") {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const reqSearchParam = searchParams.get("code_challenge_method");
  if (reqSearchParam !== null && !knownChallengeMethods.includes(reqSearchParam)) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const reqClientId = searchParams.get("client_id");
  if (reqClientId === null) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const client = db
    .query("SELECT id FROM google_auth_client WHERE id = $id")
    .get({ id: reqClientId });
  if (client === null) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 401: invalid_client </p>
    `);
  }

  const reqRedirectUri = searchParams.get("redirect_uri");
  if (reqRedirectUri === null) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const redirectUris = db
    .query("SELECT value FROM google_auth_redirect_uri WHERE client_id = $clientId")
    .all({ clientId: reqClientId });
  assert(redirectUris, array(object({ value: string() })));

  const validRedirectUris = redirectUris.map((r) => r.value);
  if (!validRedirectUris.includes(reqRedirectUri)) {
    return page(`
      <h1>Access blocked: Authorization Error</h1>
      <p>Error 400: invalid_request </p>
    `);
  }

  const paramInputs = searchParams
    .entries()
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}" />`);
  const paramInputsStr = Array.from(paramInputs).join("");

  const redirectHost = new URL(reqRedirectUri).host;

  const users = db.query(`SELECT sub,email FROM google_auth_user`).all();
  assert(users, Users);

  const userSubmitButton = users
    .map(
      (user) =>
        `<button style="height: 2rem" type="submit" name="user" value="${user.sub}">${user.email}</button>`,
    )
    .join("");

  const state = searchParams.get("state");

  const cancelUrl = new URL(reqRedirectUri);
  cancelUrl.searchParams.set("error", "access_denied");
  if (state !== null) {
    cancelUrl.searchParams.set("state", state);
  }

  return page(`
    <h1>Choose an account</h1>
    <p>to continue to ${redirectHost}</p>
    <a href="${cancelUrl.toString()}">Cancel</a>
    <form method="post" style="display: flex; flex-direction: column; gap: 1rem;">
      ${paramInputsStr} 
      ${userSubmitButton} 
    </form>
  `);
}
