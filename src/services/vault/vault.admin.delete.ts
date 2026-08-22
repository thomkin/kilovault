import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { deleted: boolean; }
export const service: ServiceDefinition<any, Response> = {
  method: "vault.admin.delete",
  isPublic: false,
  requiredPermission: ["vault.admin.delete"],
  handler: async () => ({ deleted: false }),
};
