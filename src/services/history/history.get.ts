import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { history: any[]; }
export const service: ServiceDefinition<any, Response> = {
  method: "history.get",
  isPublic: false,
  requiredPermission: ["history.get"],
  handler: async () => ({ history: [] }),
};
