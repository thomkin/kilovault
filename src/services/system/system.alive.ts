import type { ServiceDefinition } from "@crunch/types/service";

export interface Request {}

export interface Response {
  timestamp: number;
}

export const service: ServiceDefinition<Request, Response> = {
  method: "system.alive",
  isPublic: true,
  handler: async (req: Request): Promise<Response> => {
    return {
      timestamp: new Date().getTime(),
    };
  },
  validation: (input: Request) => input,
};
