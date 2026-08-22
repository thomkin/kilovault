import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { value?: string; }
export const service: ServiceDefinition<any, Response> = {
  method: "vault.admin.get",
  isPublic: false,
  requiredPermission: ["vault.admin.get"],
  handler: async () => ({ value: undefined }),
};
