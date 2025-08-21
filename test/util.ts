import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

export function init() {
  const tmpdir = fs.mkdtempSync(`${os.tmpdir()}/netero-oauth-mock-test-`);
  const dbPath = `${tmpdir}/db.sqlite`;
  const readyFifoPath = `${tmpdir}/ready.fifo`;
  const cmd = `${import.meta.dir}/../dist/netero-oauth-mock`;

  child_process.execSync(`mkfifo ${readyFifoPath}`, { stdio: "ignore" });
  const server = child_process.spawn(
    cmd,
    ["--port", "3001", "--db", dbPath, "--ready-fifo", readyFifoPath],
    {
      stdio: "inherit",
    },
  );

  if (server.pid === undefined) {
    fs.rmdirSync(tmpdir, { recursive: true });
    throw new Error("Failed to start netero-oauth-mock server");
  }

  fs.readFileSync(readyFifoPath);

  return {
    dbPath,
    tmpdir,
    server,
    [Symbol.dispose]: () => {
      server.kill();
      fs.rmdirSync(tmpdir, { recursive: true });
    },
  };
}
