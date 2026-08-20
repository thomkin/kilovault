import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Recreate vault table with correct schema
  await db.schema.dropTable("vault").execute();

  await db.schema
    .createTable("vault")
    .addColumn("id", "text", (col) => col.primaryKey().defaultTo(sql`(uuid())`))
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("createdAt", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addUniqueConstraint("vault_userId_key", ["userId", "key"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("vault").execute();

  // Restore original schema
  await db.schema
    .createTable("vault")
    .addColumn("key", "text", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("userId", "text", (col) => col.notNull())
    .addUniqueConstraint("vault_key_userId", ["key", "userId"])
    .addColumn("createdAt", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();
}
