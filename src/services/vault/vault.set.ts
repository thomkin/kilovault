import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";
import { encrypt, encryptedDataToString } from "src/crypto/encryption";
import { MAX_VAULT_FIELD_BYTES, exceedsByteLimit } from "src/services/vault/limits";

export interface Request {
  key: string;
  value: string;
}

export interface Response {}

export const service: ServiceDefinition<Request, Response> = {
  method: "vault.set",
  requiredPermission: ["vault.set"],
  isPublic: false,
  handler: async (req: Request, ctx: RpcContext): Promise<Response> => {
    console.log("[HANDLER] vault.set called");
    try {
      const VAULT_MASTER_PASSWORD = process.env.VAULT_MASTER_PASSWORD;
      if (!VAULT_MASTER_PASSWORD) {
        throw new Error("VAULT_MASTER_PASSWORD environment variable not set");
      }

      // Server-side encryption with master password
      const encrypted = await encrypt(req.value, VAULT_MASTER_PASSWORD);
      const encryptedValue = encryptedDataToString(encrypted);

      const existing = await db
        .selectFrom("vault")
        .select("key")
        .where("key", "=", req.key)
        .where("userId", "=", ctx.userId)
        .executeTakeFirst();

      if (existing) {
        await db
          .updateTable("vault")
          .set({ value: encryptedValue })
          .where("key", "=", req.key)
          .where("userId", "=", ctx.userId)
          .execute();
      } else {
        await db
          .insertInto("vault")
          .values({
            key: req.key,
            value: encryptedValue,
            userId: ctx.userId,
          })
          .execute();
      }

      await db
        .insertInto("history")
        .values({
          key: req.key,
          userId: ctx.userId || "unknown-user-should-never-happen",
          type: "set",
        })
        .execute();
    } catch (error) {
      console.error("Error setting vault value:", error);
      throw error;
    }
    return {};
  },
  validation: (req: Request) => {
    if (!req || !req.key || !req.value) {
      return null;
    }
    if (exceedsByteLimit(req.key, MAX_VAULT_FIELD_BYTES)) {
      return null;
    }
    if (exceedsByteLimit(req.value, MAX_VAULT_FIELD_BYTES)) {
      return null;
    }

    return { key: req.key, value: req.value };
  },
};
