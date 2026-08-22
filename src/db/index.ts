import type { Database } from "./types";

let dbInstance: any = null;

function getDb(): any {
  if (!dbInstance) {
    const { Kysely } = require("kysely");
    const { LibsqlDialect } = require("@libsql/kysely-libsql");
    const { createClient } = require("@libsql/client");

    dbInstance = new Kysely({
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

export const db = new Proxy({} as any, {
  get(target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
