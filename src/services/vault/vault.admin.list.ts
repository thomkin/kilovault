import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";

export interface Request {
  userId?: string;
}

export interface Response {
  keys: Array<{
    key: string;
    userId: string;
  }>;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "vault.admin.list",
  isPublic: false,
  requiredPermission: ["admin"],
  handler: async (req: Request): Promise<Response> => {
    console.log("[HANDLER] vault.admin.list called");
    let query = db.selectFrom("vault").select(["key", "userId"]);

    if (req.userId) {
      query = query.where("userId", "=", req.userId);
    }

    const keys = await query.execute();

    return { keys };
  },
  validation: (input: Request) => {
    if (input.userId && typeof input.userId !== "string") {
      return null;
    }
    return input || {};
  },
};
