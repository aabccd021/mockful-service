import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import * as util from "node:util";
import type { Context, Handle } from "util/index.ts";
import { handle as accountsGoogleCom } from "./accounts.google.com/_route.ts";
import { handle as apiPaddleCom } from "./api.paddle.com/_route.ts";
import { handle as oauth2GoogleapisCom } from "./oauth2.googleapis.com/_route.ts";

const urlToServe: Record<string, Handle> = {
  "accounts.google.com": accountsGoogleCom,
  "oauth2.googleapis.com": oauth2GoogleapisCom,
  "sandbox-api.paddle.com": apiPaddleCom,
  "api.paddle.com": apiPaddleCom,
};

async function handle(originalReq: Request, ctx: Context): Promise<Response> {
  const originalUrl = new URL(originalReq.url);
  const url = new URL(originalUrl.pathname.slice(1) + originalUrl.search + originalUrl.hash);
  const req = new Request(url, originalReq);

  const subHandle = urlToServe[url.hostname];
  if (subHandle === undefined) {
    return new Response(null, { status: 404 });
  }

  const paths = url.pathname.split("/").filter((p) => p !== "");
  return await subHandle(req, ctx, paths);
}

const args = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    port: {
      type: "string",
      default: "3000",
      short: "p",
    },
  },
});

const neteroState = process.env["NETERO_STATE"];
if (neteroState === undefined) {
  throw new Error("Environment variable NETERO_STATE is required.");
}

const db = new sqlite.Database(`${neteroState}/mock.sqlite`, {
  strict: true,
  safeIntegers: true,
});

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

Bun.serve({
  port: parseInt(args.values.port, 10),
  development: false,
  fetch: (req) => handle(req, { db }),
});

if (fs.existsSync(`/tmp/${process.ppid}-netero-oauth-mock.fifo`)) {
  fs.writeFileSync(`/tmp/${process.ppid}-netero-oauth-mock.fifo`, "");
}
