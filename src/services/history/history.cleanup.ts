import type { ServiceDefinition, RpcContext } from "@crunch/types/service";
import { sql } from "kysely";
import { db } from "src/db";

export interface Request {}

export interface Response {
  count: number;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "history.cleanup",
  isPublic: false,
  requiredPermission: ["admin"],
  handler: async (req: Request, ctx: RpcContext): Promise<Response> => {
    // delete history older than 30 days
    const count = await db
      .deleteFrom("history")
      .where("createdAt", "<", sql<string>`datetime('now', '-30 days')`)
      .executeTakeFirst();

    return { count: Number(count?.numDeletedRows) || 0 };
  },
  validation: (input: Request) => {
    return input;
  },
};
