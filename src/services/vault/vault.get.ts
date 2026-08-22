import type { ServiceDefinition } from "@crunch/types/service";
export interface Response { value?: string; }
export const service: ServiceDefinition<any, Response> = {
  method: "vault.get",
  isPublic: false,
  requiredPermission: ["vault.get"],
  handler: async () => ({ value: undefined }),
};
