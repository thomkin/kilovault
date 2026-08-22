import type { ServiceDefinition } from "@crunch/types/service";
export interface Response {}
export const service: ServiceDefinition<any, Response> = {
  method: "vault.set",
  isPublic: false,
  requiredPermission: ["vault.set"],
  handler: async () => ({}),
};
