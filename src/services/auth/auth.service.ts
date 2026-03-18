import type { JwtPayload, ServiceDefinition } from "@crunch/types/service";
import { signToken } from "@crunch/auth/utils";

export interface Request {
  secret: string;
  userId: string;
  permissions?: Record<string, boolean>;
}

export interface Response {
  token: string;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "auth.getToken",
  isPublic: true,
  handler: async (req: Request): Promise<Response> => {
    const EXPECTED_SECRET = process.env.AUTH_SECRET;

    if (!EXPECTED_SECRET) {
      throw new Error("AUTH_SECRET environment variable not set");
    }

    if (req.secret !== EXPECTED_SECRET) {
      throw new Error("Invalid secret");
    }

    const token = await signToken(
      { sub: req.userId, permissions: req.permissions } as JwtPayload,
      process.env.JWT_SECRET as string,
    );

    return { token };
  },
  validation: (req: Request) => {
    if (!req.secret || typeof req.secret !== "string") {
      return null;
    }
    return req;
  },
};
