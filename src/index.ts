import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { handle as googleAuth } from "./google/auth.ts";
import { handle as googleToken } from "./google/token.ts";

type Handle = (req: Request) => Promise<Response>;

const urlToServe: Record<string, Handle> = {
  "oauth2.googleapis.com": googleToken,
  "accounts.google.com": googleAuth,
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

const port =
  arg.values.port !== undefined ? Number(arg.values.port) : undefined;

Bun.serve({ port, fetch: handle });

const onReadyPipe = arg.values["on-ready-pipe"];
if (onReadyPipe !== undefined) {
  writeFileSync(onReadyPipe, "");
}
