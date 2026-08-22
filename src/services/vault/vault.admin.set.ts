import type { ServiceDefinition } from "@crunch/types/service";
export interface Response {}
export const service: ServiceDefinition<any, Response> = {
  method: "vault.admin.set",
  isPublic: false,
  requiredPermission: ["vault.admin.set"],
  handler: async () => ({}),
};
