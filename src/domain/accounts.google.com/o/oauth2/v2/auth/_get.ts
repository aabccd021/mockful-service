import { pageTemplate } from "@util/accounts.google.com";
import { type Context, errorMessage } from "@util/index.ts";
import { array, assert, object, string } from "superstruct";

const Users = array(
  object({
    sub: string(),
    email: string(),
  }),
);

const knownScopes = ["openid", "email"];

export function handle(ctx: Context): Response {
  const searchParams = new URL(ctx.req.url).searchParams;

  const clientId = searchParams.get("client_id");

  const scopes = searchParams.get("scope")?.split(" ") ?? [];
  for (const scope of scopes) {
    if (!knownScopes.includes(scope)) {
      const errorUrl = new URL(
        `${ctx.neteroOrigin}/https://accounts.google.com/signin/oauth/error/v2`,
      );
      errorUrl.searchParams.set("flowName", "GeneralOAuthFlow");
      errorUrl.searchParams.set("authError", "xxx");
      if (clientId !== null) {
        errorUrl.searchParams.set("client_id", clientId);
      }
      return Response.redirect(errorUrl, 302);
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

  const body = `
    <h1>Choose an account</h1>
    <p>to continue to ${redirectHost}</p>
    <form method="post" style="display: flex; flex-direction: column; gap: 1rem;">
      ${paramInputsStr} 
      ${userSubmitButton} 
    </form>
  `;
  return new Response(pageTemplate(body), {
    headers: {
      "content-type": "text/html",
    },
  });
}
