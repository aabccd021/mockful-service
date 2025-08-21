import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

export type Context = {
  dbPath: string;
  server: child_process.ChildProcess;
  readyFifoPath: string;
};

export function init(): Context {
  const testPrefix = `${os.tmpdir()}/netero-oauth-mock-test-${Date.now()}`;
  const dbPath = `${testPrefix}.sqlite`;
  const readyFifoPath = `${testPrefix}.ready.fifo`;

  child_process.execSync(`mkfifo ${readyFifoPath}`, { stdio: "ignore" });
  const server = child_process.spawn(
    "netero-oauth-mock",
    ["--port", "3001", "--db", dbPath, "--ready-fifo", readyFifoPath],
    {
      stdio: "inherit",
    },
  );
  fs.readFileSync(readyFifoPath);

  return { dbPath, readyFifoPath, server };
}

export function deinit(ctx: Context): void {
  ctx.server.kill();
  fs.unlinkSync(ctx.dbPath);
  fs.unlinkSync(ctx.readyFifoPath);
}
