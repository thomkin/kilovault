import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { count: number; }
export const service: ServiceDefinition<any, Response> = {
  method: "history.cleanup",
  isPublic: false,
  requiredPermission: ["history.cleanup"],
  handler: async () => ({ count: 0 }),
};
