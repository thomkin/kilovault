import type { ServiceDefinition } from "@crunch/types/service";
import { db } from "src/db";
import { encrypt, encryptedDataToString } from "../../crypto/encryption";

export interface Request {
  userId: string;
  key: string;
  value: string;
}

export interface Response {}

export const service: ServiceDefinition<Request, Response> = {
  method: "vault.admin.set",
  isPublic: false,
  requiredPermission: ["admin"],
  handler: async (req: Request): Promise<Response> => {
    const VAULT_MASTER_PASSWORD = process.env.VAULT_MASTER_PASSWORD;
    if (!VAULT_MASTER_PASSWORD) {
      throw new Error("VAULT_MASTER_PASSWORD environment variable not set");
    }

    const encrypted = encrypt(req.value, VAULT_MASTER_PASSWORD);
    const encryptedValue = encryptedDataToString(encrypted);

    const existing = await db
      .selectFrom("vault")
      .select("key")
      .where("key", "=", req.key)
      .where("userId", "=", req.userId)
      .executeTakeFirst();

    if (existing) {
      await db
        .updateTable("vault")
        .set({ value: encryptedValue })
        .where("key", "=", req.key)
        .where("userId", "=", req.userId)
        .execute();
    } else {
      await db
        .insertInto("vault")
        .values({
          key: req.key,
          value: encryptedValue,
          userId: req.userId,
        })
        .execute();
    }

    await db
      .insertInto("history")
      .values({
        key: req.key,
        userId: req.userId,
        type: "set",
      })
      .execute();

    return {};
  },
  validation: (input: Request) => {
    if (!input || !input.userId || typeof input.userId !== "string") {
      return null;
    }
    if (!input.key || typeof input.key !== "string") {
      return null;
    }
    if (!input.value || typeof input.value !== "string") {
      return null;
    }
    return { userId: input.userId, key: input.key, value: input.value };
  },
};
