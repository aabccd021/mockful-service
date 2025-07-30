import { type Context, errorMessage } from "@util/index.ts";
import { array, assert, object, string } from "superstruct";

const Users = array(
  object({
    sub: string(),
    email: string(),
  }),
);

const knownScopes = ["openid", "email"];

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
export function handle(ctx: Context): Response {
  const searchParams = new URL(ctx.req.url).searchParams;

  const scopes = searchParams.get("scope")?.split(" ") ?? [];
  for (const scope of scopes) {
    if (!knownScopes.includes(scope)) {
      return page(`
        <h1>Access blocked: Authorization Error</h1>
        <p>Error 400: invalid_scope </p>
      `);
    }
  }

  const paramInputs = searchParams
    .entries()
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}" />`);
  const paramInputsStr = Array.from(paramInputs).join("");

  const responseType = searchParams.get("response_type");
  if (responseType !== "code") {
    return errorMessage(`Invalid response_type: "${responseType}".`, `Expected "code".`);
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

  return page(`
    <h1>Choose an account</h1>
    <p>to continue to ${redirectHost}</p>
    <form method="post" style="display: flex; flex-direction: column; gap: 1rem;">
      ${paramInputsStr} 
      ${userSubmitButton} 
    </form>
  `);
}
