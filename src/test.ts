import * as fs from "node:fs";

const testFiles = fs
  .readdirSync(import.meta.dir, { recursive: true, encoding: "utf8" })
  .filter((filename) => filename.endsWith(".test.ts"));

for (const testFile of testFiles) {
  console.info(`\n# ${testFile}`);
  await import(`${import.meta.dir}/${testFile}`);
}
