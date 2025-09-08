import type * as sqlite from "bun:sqlite";

export function dateNow(ctx: Context): Date {
  const row = ctx.db.query("SELECT epoch_millis FROM config_now_view 'now'").get();
  if (
    row === null ||
    typeof row !== "object" ||
    !("epoch_millis" in row) ||
    typeof row.epoch_millis !== "number"
  ) {
    throw new Error(`Absurd 'now' epoch_millis in config table: ${JSON.stringify(row)}`);
  }
  return new Date(row.epoch_millis);
}

export type Context = {
  readonly db: sqlite.Database;
  readonly req: Request;
  readonly urlPrefix: string;
};
