import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import type { Context } from "@util";
import { handle as accountsGoogleCom } from "./accounts.google.com/route.ts";
import { handle as apiPaddleCom } from "./api.paddle.com/route.ts";
import { handle as discordCom } from "./discord.com/route.ts";
import { handle as oauth2GoogleapisCom } from "./oauth2.googleapis.com/route.ts";

// @ts-ignore
import migration from "./schema.sql" with { type: "text" };

type Handler = (ctx: Context, paths: string[]) => Promise<Response>;

const domainHandlers: Record<string, Handler> = {
  "accounts.google.com": accountsGoogleCom,
  "sandbox-api.paddle.com": apiPaddleCom,
  "api.paddle.com": apiPaddleCom,
  "oauth2.googleapis.com": oauth2GoogleapisCom,
  "discord.com": discordCom,
};

async function handle(originalReq: Request, dbPath: string): Promise<Response> {
  const originalUrl = new URL(originalReq.url);
  const translatedUrl = new URL(
    originalUrl.pathname.slice(1) + originalUrl.search + originalUrl.hash,
  );

  const dbPathExists = fs.existsSync(dbPath);
  using db = new sqlite.Database(dbPath, { strict: true, create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  if (!dbPathExists) {
    db.exec(migration);
  }

  const staticRoute = db
    .query<{ response_body: string; response_status: bigint }, sqlite.SQLQueryBindings>(
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
      headers: Object.fromEntries(headers.map(({ name, value }) => [name, value])),
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

  Bun.serve({
    port: Number.parseInt(port, 10),
    development: false,
    fetch: (req) => handle(req, dbPath),
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
