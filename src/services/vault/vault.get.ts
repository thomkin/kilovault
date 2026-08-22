import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";
import { decrypt, stringToEncryptedData } from "src/crypto/encryption";

export interface Request {
  key: string;
}

export interface Response {
  value: string | undefined;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "vault.get",
  isPublic: false,
  requiredPermission: ["vault.get"],
  handler: async (req: Request, ctx: RpcContext): Promise<Response> => {
    console.log("[HANDLER] vault.get called");
    const VAULT_MASTER_PASSWORD = process.env.VAULT_MASTER_PASSWORD;
    if (!VAULT_MASTER_PASSWORD) {
      throw new Error("VAULT_MASTER_PASSWORD environment variable not set");
    }

    const result = await db
      .selectFrom("vault")
      .where("userId", "=", ctx.userId)
      .where("key", "=", req.key)
      .select("value")
      .executeTakeFirst();

    await db
      .insertInto("history")
      .values({
        key: req.key,
        userId: ctx.userId,
        type: "get",
      })
      .execute();

    if (!result?.value) {
      return { value: undefined };
    }

    try {
      const encrypted = stringToEncryptedData(result.value);
      const decryptedValue = await decrypt(encrypted, VAULT_MASTER_PASSWORD);
      return { value: decryptedValue };
    } catch (error) {
      console.error("Error decrypting vault value:", error);
      throw new Error("Failed to decrypt value");
    }
  },
  validation: (input: Request) => {
    if (!input || !input.key || typeof input.key !== "string") {
      return null;
    }

    return { key: input.key };
  },
};
