import * as sqlite from "bun:sqlite";
import * as test from "@test-util";
import * as oauth from "openid-client";

using ctx = test.init();

{
  console.info("success no challenge method");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomNonce();
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge: pkceCodeVerifier,
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
}

{
  console.info("success plain");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomNonce();
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge: pkceCodeVerifier,
    code_challenge_method: "plain",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);
  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
}

{
  console.info("success s256");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);
  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
}

{
  console.info("success scope email");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email, email_verified) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com', 'true');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid email",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
  if (tokenResponse.claims().email !== "kita@example.com") throw new Error();
  if (tokenResponse.claims().email_verified !== true) throw new Error();
}

{
  console.info("success scope email verified");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email, email_verified) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com', 'false');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid email",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
  if (tokenResponse.claims().email !== "kita@example.com") throw new Error();
  if (tokenResponse.claims().email_verified !== false) throw new Error();
}

{
  console.info("success scope missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier,
      expectedState: state,
    })
    .catch((error) => error);
  if (tokenResponse.access_token === undefined) throw new Error();
  if (tokenResponse.scope !== "") throw new Error();
  if (tokenResponse.token_type !== "bearer") throw new Error();
}

{
  console.info("success");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    state,
    prompt: "select_account consent",
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);
  if (tokenResponse.claims().sub !== "kita-sub") throw new Error();
}

{
  console.info("auth header credential missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic `,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Bad Request") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("auth header missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Could not determine client ID from request.")
    throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("auth header prefix invalid");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Advanced ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Could not determine client ID from request.")
    throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("client id mismatch");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const serverMetadata = {
    issuer: "https://accounts.google.com",
    token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
    authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  };

  const config = new oauth.Configuration(
    serverMetadata,
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );

  const invalidConfig = new oauth.Configuration(
    serverMetadata,
    "invalid_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);
  oauth.allowInsecureRequests(invalidConfig);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(invalidConfig, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (!(tokenResponse instanceof oauth.ResponseBodyError)) throw new Error();
  if (tokenResponse.status !== 401) throw new Error();
  if (tokenResponse.cause.error !== "invalid_client") throw new Error();
  if (tokenResponse.cause.error_description !== "The OAuth client was not found.")
    throw new Error();
}

{
  console.info("client id missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(":mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Could not determine client ID from request.")
    throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("client secret mismatch");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const serverMetadata = {
    issuer: "https://accounts.google.com",
    token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
    authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
  };

  const config = new oauth.Configuration(
    serverMetadata,
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );

  const invalidConfig = new oauth.Configuration(
    serverMetadata,
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("invalid_client_secret"),
  );
  oauth.allowInsecureRequests(config);
  oauth.allowInsecureRequests(invalidConfig);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(invalidConfig, location, {
      pkceCodeVerifier,
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (!(tokenResponse instanceof oauth.ResponseBodyError)) throw new Error();
  if (tokenResponse.status !== 401) throw new Error();
  if (tokenResponse.cause.error !== "invalid_client") throw new Error();
  if (tokenResponse.cause.error_description !== "Unauthorized") throw new Error();
}

{
  console.info("client secret missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "client_secret is missing.") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("code invalid");
  test.resetDb(ctx);
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: "foo",
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_grant") throw new Error();
  if (tokenResponseBody.error_description !== "Malformed auth code.") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("code missing");
  test.resetDb(ctx);
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Missing required parameter: code") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("code verifier invalid");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "plain",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier: "invalid_pkceCodeVerifier",
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (tokenResponse.cause.error !== "invalid_grant") throw new Error();
  if (tokenResponse.cause.error_description !== "Invalid code verifier.") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("code verifier missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/login-callback",
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_grant") throw new Error();
  if (tokenResponseBody.error_description !== "Missing code verifier.") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("code verifier s256 invalid");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
    INSERT INTO google_auth_redirect_uri (client_id, value) VALUES ('mock_client_id', 'https://localhost:3000/login-callback');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const pkceCodeVerifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(pkceCodeVerifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");

  const tokenResponse = await oauth
    .authorizationCodeGrant(config, location, {
      pkceCodeVerifier: "invalid_pkceCodeVerifier",
      expectedState: state,
      idTokenExpected: true,
    })
    .catch((error) => error);

  if (tokenResponse.error !== "invalid_grant") throw new Error();
  if (tokenResponse.error_description !== "Invalid code verifier.") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("get");
  test.resetDb(ctx);
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token");

  if (tokenResponse.status !== 405) throw new Error();
}

{
  console.info("grant type invalid");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "foo",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "unsupported_grant_type") throw new Error();
  if (tokenResponseBody.error_description !== "Invalid grant_type: foo") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("redirect uri mismatch");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://localhost:3000/invalid-login-callback",
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "redirect_uri_mismatch") throw new Error();
  if (tokenResponseBody.error_description !== "Bad Request") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}

{
  console.info("redirect uri missing");
  test.resetDb(ctx);

  new sqlite.Database(ctx.dbPath).exec(`
    INSERT INTO google_project (id) VALUES ('mock_project_id');
    INSERT INTO google_auth_user (project_id, sub, email) VALUES ('mock_project_id', 'kita-sub', 'kita@example.com');
    INSERT INTO google_auth_client (project_id, id, secret) VALUES ('mock_project_id', 'mock_client_id', 'mock_client_secret');
  `);

  const config = new oauth.Configuration(
    {
      issuer: "https://accounts.google.com",
      token_endpoint: "http://localhost:3001/https://oauth2.googleapis.com/token",
      authorization_endpoint: "http://localhost:3001/https://accounts.google.com/o/oauth2/v2/auth",
    },
    "mock_client_id",
    {},
    oauth.ClientSecretBasic("mock_client_secret"),
  );
  oauth.allowInsecureRequests(config);

  const code_verifier = oauth.randomPKCECodeVerifier();
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier);
  const state = oauth.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: "https://localhost:3000/login-callback",
    scope: "openid",
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const authUrl = oauth.buildAuthorizationUrl(config, parameters);

  const loginResponse = await fetch(authUrl, {
    method: "POST",
    redirect: "manual",
    body: new URLSearchParams({
      user_sub: "kita-sub",
    }),
  });

  const location = new URL(loginResponse.headers.get("Location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  const tokenResponse = await fetch("http://localhost:3001/https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa("mock_client_id:mock_client_secret")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier,
    }),
  });

  const tokenResponseBody = await tokenResponse.json();
  if (tokenResponseBody.error !== "invalid_request") throw new Error();
  if (tokenResponseBody.error_description !== "Missing parameter: redirect_uri") throw new Error();
  if (tokenResponse.status !== 400) throw new Error();
}
