import type * as sqlite from "bun:sqlite";

export function nowIso(ctx: Context): string {
  const row = ctx.db
    .query<{ value: string }, []>("SELECT value FROM config WHERE name = 'now'")
    .get();
  if (row === null) {
    return new Date().toISOString();
  }
  return row.value;
}

export type Context = {
  readonly db: sqlite.Database;
  readonly req: Request;
  readonly urlPrefix: string;
};
