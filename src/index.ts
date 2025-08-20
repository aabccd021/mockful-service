import { serve } from "./serve.ts";

const [subcommand, ...argsStr] = process.argv.slice(2);

if (subcommand === "serve") {
  serve(argsStr);
}
