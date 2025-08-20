import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

export function initServer() {
  // tmp
  const dbfile = `${os.tmpdir()}/${Math.random()}.sqlite`;

  const executable = `${import.meta.dir}/../dist/netero-oauth-mock`;

  child_process.execSync(`${executable} prepare`, { stdio: "inherit" });
  const server = child_process.spawn(executable, ["serve", "--port", "3001", "--db", dbfile], {
    stdio: "inherit",
  });
  child_process.execSync(`${executable} wait-ready`, { stdio: "inherit" });

  return {
    dbfile,
    [Symbol.dispose]() {
      server.kill();
      fs.rmSync(dbfile);
    },
  };
}
