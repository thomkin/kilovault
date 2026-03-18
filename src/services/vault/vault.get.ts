import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";

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

    return {
      value: result?.value,
    };
  },
  validation: (input: Request) => {
    if (!input || !input.key || typeof input.key !== "string") {
      return null;
    }

    return { key: input.key }; //make sure we remove all other items that might be there
  },
};
