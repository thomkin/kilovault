import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { keys: any[]; }
export const service: ServiceDefinition<any, Response> = {
  method: "vault.admin.list",
  isPublic: false,
  requiredPermission: ["vault.admin.list"],
  handler: async () => ({ keys: [] }),
};
