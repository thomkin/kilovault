import { describe, it, expect } from "vitest";
import { service } from "./system.alive";
import { RpcContext } from "@crunch/types/service";

describe("System Alive Service", () => {
  it("get the current time", async () => {
    const ctx: RpcContext = {
      headers: new Headers(),
      permissions: {},
      params: {},
      query: {},
      tokenPayload: {
        sub: "test",
        permissions: {},
        exp: Date.now() + 60 * 60 * 1000,
      },
      userId: "test",
    };
    const result = await service.handler({}, ctx);
    const now = Date.now() - result.timestamp;
    expect(now).toBeLessThan(1);
  });
});
