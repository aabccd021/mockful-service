import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { handle as googleAuth } from "./google/auth.ts";
import { handle as googleToken } from "./google/token.ts";
import type { Handle } from "./util.ts";

const urlToServe: Record<string, Handle> = {
  "accounts.google.com": googleAuth,
  "oauth2.googleapis.com": googleToken,
};

const [url, ...args] = process.argv.slice(2);

if (url === undefined) {
  console.error("URL is required.");
  process.exit(1);
}

const handle = urlToServe[url];
if (handle === undefined) {
  console.error(`Unknown URL: ${url}`);
  process.exit(1);
}

const arg = parseArgs({
  args,
  options: {
    port: {
      type: "string",
    },
    "on-ready-pipe": {
      type: "string",
    },
  },
});

const db = new Database("db.sqlite", {
  strict: true,
  safeIntegers: true,
});

const port =
  arg.values.port !== undefined ? Number(arg.values.port) : undefined;

Bun.serve({ port, fetch: (req): Promise<Response> => handle(req, { db }) });

const onReadyPipe = arg.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  writeFileSync(onReadyPipe, "");
}
