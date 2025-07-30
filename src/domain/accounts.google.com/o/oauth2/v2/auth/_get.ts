import { type Context, errorMessage } from "@util/index.ts";
import { array, assert, object, string } from "superstruct";

const Users = array(
  object({
    sub: string(),
    email: string(),
  }),
);

export function handle(ctx: Context): Response {
  const searchParams = new URL(ctx.req.url).searchParams;

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
