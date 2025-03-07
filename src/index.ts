import { Database } from "bun:sqlite";
import { existsSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { handle as googleAuth } from "./google/auth.ts";
import { handle as googleToken } from "./google/token.ts";
import type { Handle } from "./util.ts";

const urlToServe: Record<string, Handle> = {
  "https://accounts.google.com/o/oauth2/v2/auth": googleAuth,
  "https://oauth2.googleapis.com/token": googleToken,
};

async function handle(req: Request, ctx: { db: Database }): Promise<Response> {
  const path = new URL(req.url).pathname;
  const pathWithoutLeadingSlash = path.slice(1);

  const subHandle = urlToServe[pathWithoutLeadingSlash];
  if (subHandle === undefined) {
    console.error(`Path not found: ${path}`);
    return new Response(null, { status: 404 });
  }

  return await subHandle(req, ctx);
}

const args = parseArgs({
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
  },
});

if (args.values.port !== undefined && args.values.unix !== undefined) {
  throw new Error("Cannot specify both port and unix.");
}

const serverConfig =
  args.values.unix !== undefined
    ? { unix: args.values.unix }
    : { port: Number.parseInt(args.values.port ?? "3000") };

const dbExists = args.values.db !== undefined && existsSync(args.values.db);

const db = new Database(args.values.db ?? ":memory:", {
  create: true,
  strict: true,
  safeIntegers: true,
});

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

if (!dbExists) {
  db.exec(`
    CREATE TABLE google_auth_session (
      code TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      scope TEXT,
      sub TEXT,
      code_challenge TEXT,
      code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain'))
    );
`);
}

Bun.serve({
  ...serverConfig,
  fetch: (req): Promise<Response> => handle(req, { db }),
});

const onReadyPipe = args.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  writeFileSync(onReadyPipe, "");
}
