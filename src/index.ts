import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import { serve } from "./serve.ts";

export const readyFifo = `${os.tmpdir()}/${process.ppid}.fifo`;

const [subcommand, ...argsStr] = process.argv.slice(2);

if (subcommand === "prepare") {
  child_process.execSync(`mkfifo ${readyFifo}`);
  process.exit(0);
}

if (subcommand === "wait-ready") {
  fs.readFileSync(readyFifo);
  process.exit(0);
}

if (subcommand === "serve") {
  serve(argsStr);
  if (fs.existsSync(readyFifo)) {
    fs.writeFileSync(readyFifo, "");
  }
}
