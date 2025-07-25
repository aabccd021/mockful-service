import type { Database } from "bun:sqlite";
import {
  boolean,
  type Infer,
  number,
  object,
  optional,
  record,
  string,
} from "superstruct";

export function errorMessage(...message: string[]): Response {
  console.error(message.join(" "));
  return new Response(message.join(" "), {
    status: 400,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function getStringFormData(
  req: Request,
): Promise<ReadonlyMap<string, string>> {
  const formDataRaw = await req.formData();
  const data = new Map<string, string>();
  for (const [key, value] of formDataRaw) {
    if (typeof value === "string") {
      data.set(key, value);
    }
  }
  return data;
}

export type Context = {
  db: Database;
  data: Data;
};

export type Handle = (req: Request, ctx: Context) => Promise<Response>;

const GoogleUser = object({
  sub: optional(string()),
  email: optional(string()),
  email_verified: optional(boolean()),
});

export type GoogleUser = Infer<typeof GoogleUser>;

export const Data = object({
  server: optional(
    object({
      port: optional(number()),
    }),
  ),
  google: optional(record(string(), GoogleUser)),
});

export type Data = Infer<typeof Data>;
