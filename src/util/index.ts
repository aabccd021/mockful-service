import type { Database } from "bun:sqlite";
import * as sqlite from "bun:sqlite";

export function errorMessage(...message: string[]): Response {
  console.error(message.join(" "));
  return new Response(message.join(" "), {
    status: 400,
    headers: { "Content-Type": "text/html" },
  });
}

export async function getStringFormData(req: Request): Promise<ReadonlyMap<string, string>> {
  const formDataRaw = await req.formData();
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

export type Handle = (req: Request, paths: string[]) => Promise<Response>;

export type ResponseOr<T> = [undefined, T] | [Response];

const neteroState = process.env["NETERO_STATE"];
if (neteroState === undefined) {
  throw new Error("Environment variable NETERO_STATE is required.");
}

const _db = new sqlite.Database(`${neteroState}/mock.sqlite`, { strict: true });

_db.exec("PRAGMA journal_mode = WAL;");
_db.exec("PRAGMA foreign_keys = ON;");

export const db = _db;

type _RequestBodyOf<T> = T extends { requestBody?: infer R } ? R : never;

type _ContentOf<T> = T extends { content: infer C } ? C : never;

type _ApplicationJsonOf<T> = T extends { "application/json": infer R } ? R : never;

export type RequestBodyOf<T> = _ApplicationJsonOf<_ContentOf<_RequestBodyOf<T>>>;

export type ResponseOf<
  T extends { responses: Record<string, unknown> },
  K extends keyof T["responses"],
  Z extends { status: K } = { status: K },
> = [_ApplicationJsonOf<_ContentOf<T["responses"][K]>>, Z & ResponseInit];

type _ParametersOf<T> = T extends { parameters: infer P } ? P : never;

type _QueryOf<T> = T extends { query?: infer Q } ? Q : never;

export type QueryOf<T> = _QueryOf<_ParametersOf<T>>;
