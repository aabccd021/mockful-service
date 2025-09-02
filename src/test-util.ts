import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

type TestContext = {
  dbPath: string;
};

export function init(): TestContext & Disposable {
  const tmpdir = fs.mkdtempSync(`${os.tmpdir()}/`);
  const dbPath = `${tmpdir}/db.sqlite`;
  const readyFifoPath = `${tmpdir}/ready.fifo`;

  child_process.execSync(`mkfifo ${readyFifoPath}`, { stdio: "ignore" });
  const server = child_process.spawn(
    "bun",
    [
      "run",
      `${import.meta.dir}/cli.ts`,
      "serve",
      "--port",
      "3001",
      "--db",
      dbPath,
      "--ready-fifo",
      readyFifoPath,
    ],
    {
      stdio: "inherit",
    },
  );

  if (server.pid === undefined) {
    fs.rmdirSync(tmpdir, { recursive: true });
    throw new Error("Failed to start mockful-service server");
  }

  fs.readFileSync(readyFifoPath);

  return {
    dbPath,
    [Symbol.dispose]: () => {
      server.kill();
      fs.rmdirSync(tmpdir, { recursive: true });
    },
  };
}

export function resetDb(ctx: TestContext) {
  if (fs.existsSync(ctx.dbPath)) {
    fs.rmSync(ctx.dbPath);
  }
  child_process.execSync(`bun run ${import.meta.dir}/cli.ts migrate --db ${ctx.dbPath}`);
}
