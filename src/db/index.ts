import { createClient } from "@libsql/client/web";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

const dbUrl = Deno.env.get("DB_URL") || "";
const dbToken = Deno.env.get("DB_TOKEN") || "";

console.log("[DB] DB_URL =", JSON.stringify(dbUrl));
console.log("[DB] DB_TOKEN =", JSON.stringify(dbToken));
console.log("[DB] creating client...");

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: dbUrl,
      authToken: dbToken,
    }),
  }),
});

console.log("[DB] client created");
