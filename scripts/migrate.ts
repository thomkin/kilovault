import * as path from "path";
import { promises as fs } from "fs";
import { Kysely, Migrator, FileMigrationProvider } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { createClient } from "@libsql/client";

// 1. Setup the DB connection (Same as your app)
console.log(process.env.DB_URL, process.env.DB_TOKEN);
const db = new Kysely<any>({
  dialect: new LibsqlDialect({
    client: createClient({
      url: process.env.DB_URL!,
      authToken: process.env.DB_TOKEN!,
    }),
  }),
});

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This points to the folder where your 001_initial.ts sits
      migrationFolder: path.join(__dirname, "../src/db/migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(
        `✅ migration "${it.migrationName}" was executed successfully`,
      );
    } else if (it.status === "Error") {
      console.error(`❌ failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("Failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
