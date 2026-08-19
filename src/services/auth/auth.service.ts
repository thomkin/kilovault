import type { JwtPayload, ServiceDefinition } from "@crunch/types/service";
import { signToken } from "@crunch/auth/utils";
import { timingSafeEqual } from "crypto";

export interface Request {
  secret: string;
  userId: string;
  permissions?: Record<string, boolean>;
  expiresIn?: number; // Optional token expiration in seconds
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

    // Constant-time comparison to prevent timing attacks
    let secretMatch = false;
    try {
      secretMatch = timingSafeEqual(
        Buffer.from(req.secret),
        Buffer.from(EXPECTED_SECRET),
      );
    } catch {
      // timingSafeEqual throws if lengths differ; treat as mismatch
      secretMatch = false;
    }

    if (!secretMatch) {
      throw new Error("Invalid secret");
    }

    const payload: JwtPayload = {
      sub: req.userId,
      permissions: req.permissions,
    };

    // Add expiration if requested (optional for backend services)
    if (req.expiresIn) {
      payload.exp = Math.floor(Date.now() / 1000) + req.expiresIn;
    }

    const token = await signToken(
      payload,
      process.env.JWT_SECRET as string,
    );

    return { token };
  },
  validation: (req: Request) => {
    if (!req.secret || typeof req.secret !== "string") {
      return null;
    }
    if (!req.userId || typeof req.userId !== "string") {
      return null;
    }
    if (req.expiresIn !== undefined) {
      if (typeof req.expiresIn !== "number") {
        return null;
      }
      if (req.expiresIn <= 0) {
        return null;
      }
    }
    if (req.permissions !== undefined && typeof req.permissions !== "object") {
      return null;
    }
    return req;
  },
};
