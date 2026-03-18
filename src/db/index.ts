import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { createClient } from "@libsql/client";
import { Database } from "./types";

console.log("Debuggign ", process.env.DB_URL, process.env.DB_TOKEN);
export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: process.env.DB_URL!,
      authToken: process.env.DB_TOKEN!,
    }),
    LibsqlDialect,
  }),
});
