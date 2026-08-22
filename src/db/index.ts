import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { createClient } from "@libsql/client";
import { Database } from "./types";

let dbInstance: Kysely<Database> | null = null;

function getDb(): Kysely<Database> {
  if (!dbInstance) {
    dbInstance = new Kysely<Database>({
      dialect: new LibsqlDialect({
        client: createClient({
          url: process.env.DB_URL!,
          authToken: process.env.DB_TOKEN!,
        }),
        LibsqlDialect,
      }),
    });
  }
  return dbInstance;
}

export const db = new Proxy({} as Kysely<Database>, {
  get(target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
