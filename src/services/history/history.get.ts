import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { db } from "src/db";

export interface Request {
  userId?: string;
}

export interface Response {
  history: {
    id: string;
    key: string;
    type: string;
    createdAt: string;
    userId: string;
  }[];
}

export const service: ServiceDefinition<Request, Response> = {
  method: "history.get",
  isPublic: false,
  requiredPermission: ["admin"],
  handler: async (req: Request, ctx: RpcContext): Promise<Response> => {
    console.log("[HANDLER] history.get called");
    const query = db
      .selectFrom("history")
      .select(["id", "key", "type", "createdAt", "userId"]);

    if (req.userId) {
      query.where("userId", "=", req.userId);
    }

    const result = await query.execute();

    return {
      history: [],
    };
  },
  validation: (input: Request) => {
    if (!input) {
      return null;
    }

    return { userId: input.userId };
  },
};
