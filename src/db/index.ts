import { createClient } from "@libsql/client";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

const dbUrl = Deno.env.get("DB_URL") || "";
const dbToken = Deno.env.get("DB_TOKEN") || "";

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: dbUrl,
      authToken: dbToken,
    }),
  }),
});
