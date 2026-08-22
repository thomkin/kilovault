import { createClient } from "@libsql/client";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

const dbUrl = typeof Deno !== 'undefined'
  ? Deno.env.get("BUNNY_DATABASE_URL") || ""
  : process.env.DB_URL || "";

const dbToken = typeof Deno !== 'undefined'
  ? Deno.env.get("BUNNY_DATABASE_AUTH_TOKEN") || ""
  : process.env.DB_TOKEN || "";

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: dbUrl,
      authToken: dbToken,
    }),
  }),
});
