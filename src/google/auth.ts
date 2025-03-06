import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { Server } from "bun";
import { assert, nullable, object, string } from "superstruct";
import { errorMessage } from "../util.ts";

const db = new Database("db.sqlite", {
  strict: true,
  safeIntegers: true,
});

const LoginSession = nullable(
  object({
    code: string(),
    client_id: string(),
    redirect_uri: string(),
    state: nullable(string()),
    scope: nullable(string()),
    code_challenge_method: nullable(string()),
    code_challenge_value: nullable(string()),
  }),
);

function handleLoginGet(req: Request): Response {
  const searchParams = new URL(req.url).searchParams;

  const responseType = searchParams.get("response_type");
  if (responseType !== "code") {
    return errorMessage(
      `Invalid response_type: "${responseType}".`,
      `Expected "code".`,
    );
  }

  const clientId = searchParams.get("client_id");
  if (clientId === null) {
    return errorMessage("Parameter client_id is required.");
  }

  const redirectUri = searchParams.get("redirect_uri");
  if (redirectUri === null) {
    return errorMessage("Parameter redirect_uri is required.");
  }

  const scope = searchParams.get("scope");
  if (scope === null) {
    return errorMessage("Parameter scope is required.");
  }

  const state = searchParams.get("state");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const codeChallengeValue = searchParams.get("code_challenge");

  const code = crypto.randomUUID();

  db.query(
    `INSERT INTO login_session (code, redirect_uri, client_id, state, scope, code_challenge_method, code_challenge_value)
       VALUES ($code, $redirectUri, $clientId, $state, $scope, $codeChallengeMethod, $codeChallengeValue)`,
  ).run({
    code,
    clientId,
    redirectUri,
    state,
    scope,
    codeChallengeMethod,
    codeChallengeValue,
  });

  const loginForm = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Login with Google</title>
      </head>
      <body>
        <h1>Login with Google</h1>

        <p>Following fields are payload of id_token returned by https://oauth2.googleapis.com/token</p>

        <p>See 
          <a href="https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo">
            Google's OpenID Connect documentation
          </a>
          for more information
        </p>

        <form method="post">

          <input type="hidden" name="login_session_code" value="${code}" />

          <label for="google_auth_id_token_sub">sub</label>
          <input type="text" name="google_auth_id_token_sub" id="google_auth_id_token_sub" maxlength="255" required pattern="+" />

          <button>Submit</button>
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

async function handleLoginPost(req: Request): Promise<Response> {
  const formData = await req.formData();

  const code = formData.get("login_session_code");
  if (typeof code !== "string") {
    return errorMessage("Invalid code. Expected a string.");
  }

  const loginSession = db
    .query("SELECT * FROM login_session WHERE code = $code")
    .get({ code });

  assert(loginSession, LoginSession);

  if (loginSession === null) {
    return errorMessage(code, `Login session not found for code: "${code}"`);
  }

  db.query("DELETE FROM login_session WHERE code = $code").run({ code });

  const googleAuthIdTokenSub = formData.get("google_auth_id_token_sub");
  if (typeof googleAuthIdTokenSub !== "string") {
    return errorMessage("Invalid google_auth_id_token_sub. Expected a string.");
  }

  db.query(
    `
    INSERT INTO auth_session (code, client_id, redirect_uri, scope, sub, code_challenge_method, code_challenge_value)
    VALUES ($code, $clientId, $redirectUri, $scope, $sub, $codeChallengeMethod, $codeChallengeValue)
  `,
  ).run({
    code,
    clientId: loginSession.client_id,
    redirectUri: loginSession.redirect_uri,
    scope: loginSession.scope,
    sub: googleAuthIdTokenSub,
    codeChallengeMethod: loginSession.code_challenge_method,
    codeChallengeValue: loginSession.code_challenge_value,
  });

  const forwardedParamNames = ["state", "code", "scope", "authUser", "prompt"];

  const redirectUrl = new URL(loginSession.redirect_uri);
  redirectUrl.searchParams.set("code", code);

  for (const [key, value] of Object.entries(loginSession)) {
    if (value !== null && forwardedParamNames.includes(key)) {
      redirectUrl.searchParams.set(key, value);
    }
  }

  return new Response(null, {
    status: 303,
    headers: { Location: redirectUrl.toString() },
  });
}

export async function handle(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname;
  if (path !== "/o/oauth2/v2/auth") {
    return new Response(null, { status: 404 });
  }

  if (req.method === "GET") {
    return handleLoginGet(req);
  }

  if (req.method === "POST") {
    return await handleLoginPost(req);
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export function serve(args: string[]): Server {
  const arg = parseArgs({
    args,
    options: {
      port: {
        type: "string",
        alias: "p",
      },
      "on-ready-pipe": {
        type: "string",
      },
    },
  });

  const port =
    arg.values.port !== undefined ? Number(arg.values.port) : undefined;

  const server = Bun.serve({ port, fetch: handle });

  const onReadyPipe = arg.values["on-ready-pipe"];
  if (onReadyPipe !== undefined) {
    writeFileSync(onReadyPipe, "");
  }

  return server;
}
