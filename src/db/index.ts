import { createClient } from "@libsql/client/web";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import type { Database } from "./types";

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: Deno.env.get("DB_URL") || "",
      authToken: Deno.env.get("DB_TOKEN") || "",
    }),
  }),
});
