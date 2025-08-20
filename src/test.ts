import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";

export function initServer() {
  const dbfile = `${os.tmpdir()}/${Math.random()}.sqlite`;

  const cmd = `${import.meta.dir}/../dist/netero-oauth-mock`;

  child_process.execSync(`${cmd} prepare`, { stdio: "inherit" });
  const server = child_process.spawn(cmd, ["serve", "--port", "3001", "--db", dbfile], {
    stdio: "inherit",
  });
  child_process.execSync(`${cmd} wait-ready`, { stdio: "inherit" });

  return {
    dbfile,
    [Symbol.dispose]() {
      server.kill();
      fs.rmSync(dbfile);
    },
  };
}
