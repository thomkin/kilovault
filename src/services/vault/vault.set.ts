import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";

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
    try {
      const existing = await db
        .selectFrom("vault")
        .select("key")
        .where("key", "=", req.key)
        .where("userId", "=", ctx.userId)
        .executeTakeFirst();

      if (existing) {
        await db
          .updateTable("vault")
          .set({ value: req.value })
          .where("key", "=", req.key)
          .where("userId", "=", ctx.userId)
          .execute();
      } else {
        await db
          .insertInto("vault")
          .values({
            key: req.key,
            value: req.value,
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
    return req;
  },
};
