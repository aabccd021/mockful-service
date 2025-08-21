import * as fs from "node:fs";

const nonTestFiles = ["index.ts", "util.ts"];

const testFiles = fs.readdirSync(import.meta.dir).filter((filename) => !nonTestFiles.includes(filename))

for (const testFile of testFiles) {
  console.info(`\n# ${testFile}`)
  await import(`${import.meta.dir}/${testFile}`)
}
