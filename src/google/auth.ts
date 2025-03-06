import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import type { Server } from "bun";
import { assert, enums, nullable, object, string } from "superstruct";
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
  }),
);

const CodeChallenge = nullable(
  object({
    login_session_code: string(),
    method: enums(["S256", "plain"]),
    value: string(),
  }),
);

type CodeChallenge = {
  readonly method: "S256";
  readonly value: string;
};

function getCodeChallenge(
  searchParams: URLSearchParams,
): CodeChallenge | null | Response {
  const method = searchParams.get("code_challenge_method");
  const value = searchParams.get("code_challenge");

  if (method === null) {
    if (value === null) {
      return null;
    }

    return errorMessage(
      "Parameter code_challenge_method is required when code_challenge is provided.",
    );
  }

  if (value === null) {
    return errorMessage(
      "Parameter code_challenge is required when code_challenge_method is provided.",
    );
  }

  // TODO: support "plain" code_challenge_method
  if (method === "plain") {
    return errorMessage(
      'Currently oauth2-mock does not support code_challenge_method "plain."',
    );
  }

  if (method === "S256") {
    if (value.length !== 43) {
      return errorMessage(
        `Invalid code_challenge length: ${value.length}.`,
        "Expected 43.",
      );
    }
    for (const char of value) {
      if (!base64urlChars.includes(char)) {
        return errorMessage(
          `Invalid code_challenge character: "${char}".`,
          "Expected base64url character.",
        );
      }
    }
    return { method, value };
  }

  return errorMessage(
    `Invalid code_challenge_method: "${method}".`,
    `Expected "S256" or "plain".`,
  );
}

const base64urlChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const urlSafeChars = `${base64urlChars}.~`;

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

  const state = searchParams.get("state");
  if (state !== null) {
    for (const char of state) {
      if (!urlSafeChars.includes(char)) {
        return errorMessage(
          `Invalid state character: "${char}".`,
          "Expected URL-safe character.",
        );
      }
    }
  }

  const codeChallenge = getCodeChallenge(searchParams);
  if (codeChallenge instanceof Response) {
    return codeChallenge;
  }

  const scope = searchParams.get("scope");

  const code = crypto.randomUUID();

  db.query(
    `INSERT INTO login_session (code, redirect_uri, client_id, state, scope) 
       VALUES ($code, $redirectUri, $clientId, $state, $scope)`,
  ).run({
    code,
    clientId,
    redirectUri,
    state,
    scope,
  });

  if (codeChallenge !== null) {
    db.query(
      `
      INSERT INTO login_session_code_challenge (login_session_code, value, method) 
      VALUES ($loginSessionCode, $value, $method)
    `,
    ).run({
      loginSessionCode: code,
      value: codeChallenge.value,
      method: codeChallenge.method,
    });
  }

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
          <input type="text" name="google_auth_id_token_sub" id="google_auth_id_token_sub" maxlength="255" required pattern="[a-zA-Z0-9]+" />

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

  const codeChallenge = db
    .query(
      "SELECT * FROM login_session_code_challenge WHERE login_session_code = $login_session_code",
    )
    .get({ login_session_code: code });

  assert(codeChallenge, CodeChallenge);

  db.query("DELETE FROM login_session WHERE code = $code").run({ code });

  const googleAuthIdTokenSub = formData.get("google_auth_id_token_sub");
  if (typeof googleAuthIdTokenSub !== "string") {
    return errorMessage("Invalid google_auth_id_token_sub. Expected a string.");
  }

  db.query(
    `
    INSERT INTO auth_session (code, client_id, redirect_uri, scope, sub)
    VALUES ($code, $client_id, $redirect_uri, $scope, $sub)
  `,
  ).run({
    code,
    client_id: loginSession.client_id,
    redirect_uri: loginSession.redirect_uri,
    scope: loginSession.scope,
    sub: googleAuthIdTokenSub,
  });

  db.query(
    "DELETE FROM auth_session_code_challenge WHERE auth_session_code = $auth_session_code",
  ).run({ auth_session_code: code });

  const forwardedParamNames = ["state", "code", "scope", "authUser", "prompt"];

  const forwardedParams = Object.fromEntries(
    Object.entries(loginSession).filter(
      ([key, value]) =>
        forwardedParamNames.includes(key) && typeof value === "string",
    ),
  );

  const searchParams = new URLSearchParams({ ...forwardedParams, code });
  const redirectUriPath = new URL(loginSession.redirect_uri).pathname;
  const redirectLocation = `${redirectUriPath}?${searchParams.toString()}`;

  return new Response(null, {
    status: 303,
    headers: { Location: redirectLocation },
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
