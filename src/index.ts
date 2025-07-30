import * as fs from "node:fs";
import * as util from "node:util";
import type { Handle } from "util/index.ts";
import { handle as accountsGoogleCom } from "./domain/accounts.google.com/_route.ts";
import { handle as apiPaddleCom } from "./domain/api.paddle.com/_route.ts";
import { handle as oauth2GoogleapisCom } from "./domain/oauth2.googleapis.com/_route.ts";

const urlToServe: Record<string, Handle> = {
  "accounts.google.com": accountsGoogleCom,
  "oauth2.googleapis.com": oauth2GoogleapisCom,
  "sandbox-api.paddle.com": apiPaddleCom,
  "api.paddle.com": apiPaddleCom,
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

async function handle(originalReq: Request): Promise<Response> {
  const url = translateReqUrl(originalReq);
  if (url === undefined) {
    return new Response(null, { status: 404 });
  }

  const req = new Request(url, originalReq);

  const subHandle = urlToServe[url.hostname];
  if (subHandle === undefined) {
    return new Response(null, { status: 404 });
  }

  const paths = url.pathname.split("/").filter((p) => p !== "");

  return await subHandle(req, paths);
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

Bun.serve({
  port: parseInt(args.values.port, 10),
  development: false,
  fetch: handle,
});

if (fs.existsSync(`/tmp/${process.ppid}-netero-oauth-mock.fifo`)) {
  fs.writeFileSync(`/tmp/${process.ppid}-netero-oauth-mock.fifo`, "");
}
