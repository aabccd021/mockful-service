import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import type { Context, Handle } from "@util";
import { handle as accountsGoogleCom } from "./accounts.google.com/route.ts";
import { handle as apiPaddleCom } from "./api.paddle.com/route.ts";
import { handle as oauth2GoogleapisCom } from "./oauth2.googleapis.com/route.ts";

// @ts-ignore
import migration from "./schema.sql" with { type: "text" };

const domainHandlers: Record<string, Handle> = {
  "accounts.google.com": accountsGoogleCom,
  "sandbox-api.paddle.com": apiPaddleCom,
  "api.paddle.com": apiPaddleCom,
  "oauth2.googleapis.com": oauth2GoogleapisCom,
};

function translateUrl(originalUrlStr: string): URL | undefined {
  const originalUrl = new URL(originalUrlStr);
  try {
    return new URL(originalUrl.pathname.slice(1) + originalUrl.search + originalUrl.hash);
  } catch (_) {
    return undefined;
  }
}

function translateReqUrl(req: Request): URL | undefined {
  const originalTl = translateUrl(req.url);
  if (originalTl !== undefined) {
    return originalTl;
  }

  const referrer = req.headers.get("Referer");
  if (referrer === null) {
    return undefined;
  }

  const referrerTl = translateUrl(referrer);
  if (referrerTl === undefined) {
    return undefined;
  }

  const url = new URL(req.url);
  url.protocol = referrerTl.protocol;
  url.hostname = referrerTl.hostname;
  url.port = referrerTl.port;
  return url;
}

async function handle(originalReq: Request, db: sqlite.Database): Promise<Response> {
  const translatedUrl = translateReqUrl(originalReq);
  if (translatedUrl === undefined) {
    return new Response(null, { status: 404 });
  }

  // TODO join header
  const staticRoute = db
    .query<{ response_body: string; response_status: BigInt }, sqlite.SQLQueryBindings>(
      "SELECT response_status,response_body FROM global_static_route WHERE url = :url",
    )
    .get({ url: translatedUrl.toString() });

  if (staticRoute !== null) {
    const headers = db
      .query<{ name: string; value: string }, sqlite.SQLQueryBindings>(
        `
        SELECT name,value 
        FROM global_static_route_response_header 
        WHERE global_static_route_url = :url
        `,
      )
      .all({ url: translatedUrl.toString() });

    return new Response(staticRoute.response_body, {
      status: Number(staticRoute.response_status),
      headers: Object.fromEntries(headers.map(({name, value}) => [name, value]))
    });
  }

  const subHandle = domainHandlers[translatedUrl.hostname];
  if (subHandle === undefined) {
    return new Response(null, { status: 404 });
  }

  const req = new Request(translatedUrl, originalReq);

  const ctx: Context = { req, db };

  const paths = translatedUrl.pathname.split("/").filter((p) => p !== "");

  return await subHandle(ctx, paths);
}

async function serve(argList: string[]) {
  let port = "3000";
  let dbPath: string | undefined;
  let readyFifo: string | undefined;

  while (argList.length > 0) {
    const arg = argList.shift();

    if (arg === "--port") {
      const argPort = argList.shift();
      if (argPort === undefined) {
        throw new Error("Argument --port requires a value.");
      }
      port = argPort;
      continue;
    }

    if (arg === "--db") {
      dbPath = argList.shift();
      continue;
    }

    if (arg === "--ready-fifo") {
      readyFifo = argList.shift();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (dbPath === undefined) {
    throw new Error("Argument --db is required.");
  }

  const db = new sqlite.Database(dbPath, { strict: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  Bun.serve({
    port: Number.parseInt(port, 10),
    development: false,
    fetch: (req) => handle(req, db),
  });

  if (readyFifo !== undefined && fs.existsSync(readyFifo)) {
    await fs.promises.writeFile(readyFifo, "");
  }
}

async function migrate(argList: string[]) {
  let dbPath: string | undefined;

  while (argList.length > 0) {
    const arg = argList.shift();

    if (arg === "--db") {
      dbPath = argList.shift();
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (dbPath === undefined) {
    throw new Error("Argument --db is required.");
  }

  const db = new sqlite.Database(dbPath, { create: true });
  db.exec(migration);
}

async function main() {
  const [subCommand, ...argList] = process.argv.slice(2);

  if (subCommand === "serve") {
    await serve(argList);
    return;
  }

  if (subCommand === "migrate") {
    await migrate(argList);
    return;
  }

  throw new Error("Usage: mockful-service <subcommand> [options]\n");
}

main();
