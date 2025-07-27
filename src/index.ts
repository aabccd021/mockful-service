import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import * as util from "node:util";
import { handle as googleAuth } from "./google/auth.ts";
import { handle as googleToken } from "./google/token.ts";
import type { Context, Handle } from "./util.ts";

const urlToServe: Record<string, Handle> = {
  "https://accounts.google.com/o/oauth2/v2/auth": googleAuth,
  "https://oauth2.googleapis.com/token": googleToken,
};

async function handle(req: Request, ctx: Context): Promise<Response> {
  const path = new URL(req.url).pathname;
  const pathWithoutLeadingSlash = path.slice(1);

  const subHandle = urlToServe[pathWithoutLeadingSlash];
  if (subHandle === undefined) {
    console.error(`Path not found: ${path}`);
    return new Response(null, { status: 404 });
  }

  return await subHandle(req, ctx);
}

const args = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    "on-ready-pipe": {
      type: "string",
    },
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

process.on("SIGTERM", () => {
  db.close();
});

process.on("SIGINT", () => {
  db.close();
});

process.on("exit", () => {
  db.close();
});

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

Bun.serve({
  port: parseInt(args.values.port, 10),
  development: false,
  fetch: (req) => handle(req, { db }),
});

const onReadyPipe = args.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  fs.writeFileSync(onReadyPipe, "");
}
