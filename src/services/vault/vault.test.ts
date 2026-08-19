import { describe, it, expect, beforeEach, vi } from "vitest";
import { service as vaultGetService } from "./vault.get";
import { service as vaultSetService } from "./vault.set";
import type { RpcContext } from "@crunch/types/service";

// Mock database
vi.mock("src/db", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
  },
}));

import { db } from "src/db";

describe("vault.get Security", () => {
  let ctx: RpcContext;

  beforeEach(() => {
    ctx = {
      userId: "user-123",
      permissions: { "vault.get": true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "user-123", permissions: { "vault.get": true } },
    };
    vi.clearAllMocks();
  });

  describe("Permission Enforcement", () => {
    it("service requires vault.get permission", () => {
      expect(vaultGetService.requiredPermission).toContain("vault.get");
    });

    it("service is not public", () => {
      expect(vaultGetService.isPublic).toBe(false);
    });
  });

  describe("User Isolation", () => {
    it("filters results by userId", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue({ value: "secret-data" });
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      await vaultGetService.handler({ key: "db-password" }, ctx);

      expect(mockDb.selectFrom).toHaveBeenCalledWith("vault");
      expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-123");
      expect(mockDb.where).toHaveBeenCalledWith("key", "=", "db-password");
    });

    it("prevents accessing other user's secrets via different userId in context", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      const otherUserCtx: RpcContext = {
        userId: "user-456",
        permissions: { "vault.get": true },
        params: {},
        query: {},
        headers: new Headers(),
        tokenPayload: { sub: "user-456", permissions: { "vault.get": true } },
      };

      const result = await vaultGetService.handler({ key: "db-password" }, otherUserCtx);

      expect(result.value).toBeUndefined();
      expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-456");
    });

    it("returns empty if key not found for user", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      const result = await vaultGetService.handler({ key: "nonexistent" }, ctx);

      expect(result.value).toBeUndefined();
    });
  });

  describe("Input Validation", () => {
    it("rejects missing key", () => {
      const result = vaultGetService.validation({ key: "" } as any);
      expect(result).toBeNull();
    });

    it("rejects non-string key", () => {
      const result = vaultGetService.validation({ key: null } as any);
      expect(result).toBeNull();
    });

    it("passes valid key through validation", () => {
      const req = { key: "valid-key" };
      const result = vaultGetService.validation(req);
      expect(result).toEqual({ key: "valid-key" });
    });

    it("removes extra fields during validation", () => {
      const result = vaultGetService.validation({
        key: "valid-key",
        extra: "should-be-removed",
      } as any);
      expect(result).toEqual({ key: "valid-key" });
    });
  });

  describe("Audit Logging", () => {
    it("logs every vault.get operation", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue({ value: "secret" });
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      await vaultGetService.handler({ key: "test-key" }, ctx);

      expect(mockDb.insertInto).toHaveBeenCalledWith("history");
      expect(mockDb.values).toHaveBeenCalledWith({
        key: "test-key",
        userId: "user-123",
        type: "get",
      });
    });
  });
});

describe("vault.set Security", () => {
  let ctx: RpcContext;

  beforeEach(() => {
    ctx = {
      userId: "user-123",
      permissions: { "vault.set": true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "user-123", permissions: { "vault.set": true } },
    };
    vi.clearAllMocks();
  });

  describe("Permission Enforcement", () => {
    it("service requires vault.set permission", () => {
      expect(vaultSetService.requiredPermission).toContain("vault.set");
    });

    it("service is not public", () => {
      expect(vaultSetService.isPublic).toBe(false);
    });
  });

  describe("User Isolation", () => {
    it("stores secrets with correct userId", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null); // New key
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      await vaultSetService.handler({ key: "db-password", value: "secret123" }, ctx);

      expect(mockDb.insertInto).toHaveBeenCalledWith("vault");
      expect(mockDb.values).toHaveBeenCalledWith({
        key: "db-password",
        value: "secret123",
        userId: "user-123",
      });
    });

    it("updates only user's own secrets", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue({ key: "existing" }); // Existing key
      mockDb.updateTable.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);

      await vaultSetService.handler({ key: "db-password", value: "newsecret" }, ctx);

      expect(mockDb.updateTable).toHaveBeenCalledWith("vault");
      expect(mockDb.where).toHaveBeenCalledWith("key", "=", "db-password");
      expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-123");
    });

    it("prevents overwriting other user's secrets", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      const user1Ctx: RpcContext = {
        userId: "user-1",
        permissions: { "vault.set": true },
        params: {},
        query: {},
        headers: new Headers(),
        tokenPayload: { sub: "user-1", permissions: { "vault.set": true } },
      };

      await vaultSetService.handler({ key: "shared-key", value: "user1-secret" }, user1Ctx);

      expect(mockDb.values).toHaveBeenCalledWith({
        key: "shared-key",
        value: "user1-secret",
        userId: "user-1",
      });
    });
  });

  describe("Input Validation", () => {
    it("rejects missing key", () => {
      const result = vaultSetService.validation({ key: "", value: "test" });
      expect(result).toBeNull();
    });

    it("rejects missing value", () => {
      const result = vaultSetService.validation({ key: "test", value: "" });
      expect(result).toBeNull();
    });

    it("rejects missing both key and value", () => {
      const result = vaultSetService.validation({ key: "", value: "" });
      expect(result).toBeNull();
    });

    it("passes valid request through validation", () => {
      const req = { key: "api-key", value: "secret-value" };
      const result = vaultSetService.validation(req);
      expect(result).toEqual(req);
    });
  });

  describe("Audit Logging", () => {
    it("logs every vault.set operation", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue({});

      await vaultSetService.handler({ key: "test-key", value: "test-value" }, ctx);

      expect(mockDb.insertInto).toHaveBeenCalledWith("history");
      expect(mockDb.values).toHaveBeenCalledWith({
        key: "test-key",
        userId: "user-123",
        type: "set",
      });
    });
  });

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);
      mockDb.insertInto.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.execute.mockRejectedValue(new Error("Database error"));

      await expect(
        vaultSetService.handler({ key: "test-key", value: "test-value" }, ctx)
      ).rejects.toThrow("Database error");
    });
  });
});
