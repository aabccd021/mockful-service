import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
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

const [url, ...args] = process.argv.slice(2);

if (url === undefined) {
  console.error("URL is required.");
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
