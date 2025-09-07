import type * as sqlite from "bun:sqlite";

export function dateNow(ctx: Context): Date {
  const row = ctx.db
    .query<{ value: string }, []>("SELECT value FROM config WHERE name = 'now'")
    .get();
  if (row === null) {
    return new Date();
  }
  return new Date(row.value);
}

export type Context = {
  readonly db: sqlite.Database;
  readonly req: Request;
  readonly urlPrefix: string;
};
