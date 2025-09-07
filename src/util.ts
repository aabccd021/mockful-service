import type * as sqlite from "bun:sqlite";

export async function getStringFormData(ctx: Context): Promise<ReadonlyMap<string, string>> {
  const formDataRaw = await ctx.req.formData();
  const data = new Map<string, string>();
  for (const [key, value] of formDataRaw.entries()) {
    data.set(key, value);
  }
  return data;
}

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
