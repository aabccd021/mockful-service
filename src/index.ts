import type { Server } from "bun";
import { serve as serveGoogleAuth } from "./google/auth.ts";
import { serve as serveGoogleToken } from "./google/token.ts";

type Serve = (args: string[]) => Promise<Server> | Server;

const urlToServe: Record<string, Serve> = {
  "oauth2.googleapis.com": serveGoogleToken,
  "accounts.google.com": serveGoogleAuth,
};

const [url, ...args] = process.argv.slice(2);

if (url === undefined) {
  console.error("URL is required.");
  process.exit(1);
}

const serve = urlToServe[url];
if (serve === undefined) {
  console.error(`Unknown URL: ${url}`);
  process.exit(1);
}

await serve(args);
