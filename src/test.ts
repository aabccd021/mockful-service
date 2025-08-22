import * as fs from "node:fs";

const files = fs.readdirSync(import.meta.dir, { recursive: true, encoding: "utf8" });

for (const filename of files) {
  if (filename.endsWith(".test.ts")) {
    console.info(`\n# ${filename}`);
    await import(`${import.meta.dir}/${filename}`);
  }
}
