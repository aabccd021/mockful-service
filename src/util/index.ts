import type { Database } from "bun:sqlite";

export async function getStringFormData(ctx: Context): Promise<ReadonlyMap<string, string>> {
  const formDataRaw = await ctx.req.formData();
  const data = new Map<string, string>();
  for (const [key, value] of formDataRaw.entries()) {
    if (typeof value === "string") {
      data.set(key, value);
    }
  }
  return data;
}

export type Context = {
  db: Database;
  req: Request;
  neteroOrigin: string;
};

export type Handle = (ctx: Context, paths: string[]) => Promise<Response>;

export type ResponseOr<T> = [undefined, T] | [Response];

const neteroState = process.env["NETERO_STATE"];
if (neteroState === undefined) {
  throw new Error("Environment variable NETERO_STATE is required.");
}
