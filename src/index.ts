import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import * as util from "node:util";
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

  const subHandle = domainHandlers[translatedUrl.hostname];
  if (subHandle === undefined) {
    return new Response(null, { status: 404 });
  }

  const req = new Request(translatedUrl, originalReq);

  const ctx: Context = { req, db };

  const paths = translatedUrl.pathname.split("/").filter((p) => p !== "");

  return await subHandle(ctx, paths);
}

async function main() {
  const args = util.parseArgs({
    args: process.argv.slice(2),
    options: {
      port: {
        type: "string",
        default: "3000",
        short: "p",
      },
      db: {
        type: "string",
      },
      "ready-fifo": {
        type: "string",
      },
    },
  });

  if (args.values.db === undefined) {
    throw new Error("Argument --db is required.");
  }

  const db = new sqlite.Database(args.values.db, { strict: true, create: true });

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(migration);

  Bun.serve({
    port: Number.parseInt(args.values.port, 10),
    development: false,
    fetch: (req) => handle(req, db),
  });

  const waitFifo = args.values["ready-fifo"];
  if (waitFifo !== undefined && fs.existsSync(waitFifo)) {
    await fs.promises.writeFile(waitFifo, "");
  }
}

main();
