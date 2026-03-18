import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { createClient } from "@libsql/client";
import { Database } from "./types";

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: process.env.DB_URL!,
      authToken: process.env.DB_TOKEN!,
    }),
    LibsqlDialect,
  }),
});
