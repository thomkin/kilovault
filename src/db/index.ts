import { createClient } from "@libsql/client/web";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

const dbUrl = Deno.env.get("DB_URL") || "";
const dbToken = Deno.env.get("DB_TOKEN") || "";

console.log("[DB] module loaded");
console.log("[DB] DB_URL =", JSON.stringify(dbUrl));
console.log("[DB] DB_TOKEN =", JSON.stringify(dbToken));

// TEMP DEBUG: skip real client construction to isolate whether env vars are
// correct from whether the connection itself hangs. Set to false once env
// vars are confirmed correct, to test the real connection.
const SKIP_CLIENT_CONSTRUCTION = true;

function createDb(): Kysely<Database> {
  console.log("[DB] creating client...");
  const client = createClient({ url: dbUrl, authToken: dbToken });
  console.log("[DB] client created");
  return new Kysely<Database>({ dialect: new LibsqlDialect({ client }) });
}

export const db = SKIP_CLIENT_CONSTRUCTION
  ? (undefined as unknown as Kysely<Database>)
  : createDb();

console.log(
  "[DB] init done, SKIP_CLIENT_CONSTRUCTION =",
  SKIP_CLIENT_CONSTRUCTION,
);
