import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { timestamp: string; }
export const service: ServiceDefinition<unknown, Response> = {
  method: "system.alive",
  isPublic: true,
  handler: async () => ({ timestamp: new Date().toISOString() }),
};
