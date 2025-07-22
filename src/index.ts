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
    db: {
      type: "string",
    },
    "on-ready-pipe": {
      type: "string",
    },
    unix: {
      type: "string",
    },
    data: {
      type: "string",
    },
  },
});

if (args.values.port !== undefined && args.values.unix !== undefined) {
  throw new Error("Cannot specify both port and unix.");
}

if (args.values.data === undefined) {
  throw new Error("Missing required argument: --data");
}

const dataJson = fs.readFileSync(args.values.data, "utf-8");
const data: unknown = JSON.parse(dataJson);
assert(data, Data);

const serverConfig =
  args.values.unix !== undefined
    ? { unix: args.values.unix }
    : { port: Number.parseInt(args.values.port ?? "3000") };

const db = new sqlite.Database(args.values.db ?? ":memory:", {
  create: true,
  strict: true,
  safeIntegers: true,
});

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const dbExists = args.values.db !== undefined && fs.existsSync(args.values.db);
if (!dbExists) {
  db.exec(`
    CREATE TABLE google_auth_session (
      code TEXT PRIMARY KEY,
      user TEXT NOT NULL,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      scope TEXT,
      code_challenge TEXT,
      code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
    ) STRICT;
`);
}

Bun.serve({
  ...serverConfig,
  fetch: (req): Promise<Response> => handle(req, { db, data }),
});

const onReadyPipe = args.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  fs.writeFileSync(onReadyPipe, "");
}
