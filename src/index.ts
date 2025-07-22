import * as sqlite from "bun:sqlite";
import * as fs from "node:fs";
import * as util from "node:util";
import { assert } from "superstruct";
import { handle as googleAuth } from "./google/auth.ts";
import { handle as googleToken } from "./google/token.ts";
import { type Context, Data, type Handle } from "./util.ts";

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
    port: {
      type: "string",
    },
    "on-ready-pipe": {
      type: "string",
    },
  },
});

const neteroState = process.env["NETERO_STATE"];
if (neteroState === undefined) {
  throw new Error("Environment variable NETERO_STATE is required.");
}

const dataJson = fs.readFileSync(
  `${neteroState}/oauth-mock/data.json`,
  "utf-8",
);
const data: unknown = JSON.parse(dataJson);
assert(data, Data);

const db = new sqlite.Database(`${neteroState}/oauth-mock/db.sqlite`, {
  create: true,
  strict: true,
  safeIntegers: true,
});

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS google_auth_session (
    code TEXT PRIMARY KEY,
    user TEXT NOT NULL,
    client_id TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    scope TEXT,
    code_challenge TEXT,
    code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
  ) STRICT;
`);

Bun.serve({
  port:
    args.values.port === undefined ? undefined : parseInt(args.values.port, 10),
  fetch: (req): Promise<Response> => handle(req, { db, data }),
});

const onReadyPipe = args.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  fs.writeFileSync(onReadyPipe, "");
}
