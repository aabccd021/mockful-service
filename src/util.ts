import type { Database } from "bun:sqlite";

export async function getStringFormData(ctx: Context): Promise<ReadonlyMap<string, string>> {
  const formDataRaw = await ctx.req.formData();
  const data = new Map<string, string>();
  for (const [key, value] of formDataRaw.entries()) {
    data.set(key, value);
  }
  return data;
}

export type Context = {
  db: Database;
  req: Request;
  urlPrefix: string;
};
