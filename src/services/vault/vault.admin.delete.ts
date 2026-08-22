import type { ServiceDefinition } from "@crunch/types/service";
import { db } from "src/db";

export interface Request {
  userId: string;
  key: string;
}

export interface Response {
  deleted: boolean;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "vault.admin.delete",
  isPublic: false,
  requiredPermission: ["admin"],
  handler: async (req: Request): Promise<Response> => {
    console.log("[HANDLER] vault.admin.delete called");
    // const result = await db
    //   .deleteFrom("vault")
    //   .where("userId", "=", req.userId)
    //   .where("key", "=", req.key)
    //   .executeTakeFirst();

    // await db
    //   .insertInto("history")
    //   .values({
    //     key: req.key,
    //     userId: req.userId,
    //     type: "delete",
    //   })
    //   .execute();

    return {
      deleted: false,
    };
  },
  validation: (input: Request) => {
    if (!input || !input.userId || typeof input.userId !== "string") {
      return null;
    }
    if (!input.key || typeof input.key !== "string") {
      return null;
    }
    return { userId: input.userId, key: input.key };
  },
};
