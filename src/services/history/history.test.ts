import { describe, it, expect, beforeEach, vi } from "vitest";
import { service as historyGetService } from "./history.get";
import { service as historyCleanupService } from "./history.cleanup";
import type { RpcContext } from "@crunch/types/service";

// Mock database
vi.mock("src/db", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    deleteFrom: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
  },
}));

import { db } from "src/db";

describe("history.get Security", () => {
  let adminCtx: RpcContext;
  let userCtx: RpcContext;

  beforeEach(() => {
    adminCtx = {
      userId: "admin-user",
      permissions: { admin: true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "admin-user", permissions: { admin: true } },
    };

    userCtx = {
      userId: "regular-user",
      permissions: { "vault.get": true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "regular-user", permissions: { "vault.get": true } },
    };

    vi.clearAllMocks();
  });

  describe("Permission Enforcement", () => {
    it("requires admin permission", () => {
      expect(historyGetService.requiredPermission).toContain("admin");
    });

    it("service is not public", () => {
      expect(historyGetService.isPublic).toBe(false);
    });
  });

  describe("Admin Access", () => {
    it("allows admin to fetch all history", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue([
        { id: "1", key: "api-key", type: "get", userId: "user-1", createdAt: "2026-01-01" },
        { id: "2", key: "db-pass", type: "set", userId: "user-2", createdAt: "2026-01-02" },
      ]);

      const result = await historyGetService.handler({}, adminCtx);

      expect(result.history).toHaveLength(2);
      expect(mockDb.selectFrom).toHaveBeenCalledWith("history");
      expect(mockDb.select).toHaveBeenCalledWith(["id", "key", "type", "createdAt", "userId"]);
    });

    it("allows filtering by userId", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue([
        { id: "1", key: "api-key", type: "get", userId: "user-1", createdAt: "2026-01-01" },
      ]);

      const result = await historyGetService.handler({ userId: "user-1" }, adminCtx);

      expect(result.history).toHaveLength(1);
      expect(mockDb.where).toHaveBeenCalledWith("userId", "=", "user-1");
    });

    it("returns empty array if no history found", async () => {
      const mockDb = db as any;
      mockDb.selectFrom.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.execute.mockResolvedValue([]);

      const result = await historyGetService.handler({}, adminCtx);

      expect(result.history).toEqual([]);
    });
  });

  describe("Input Validation", () => {
    it("handles undefined userId filter", () => {
      const result = historyGetService.validation({});
      expect(result).toEqual({ userId: undefined });
    });

    it("passes userId filter through validation", () => {
      const result = historyGetService.validation({ userId: "user-123" });
      expect(result).toEqual({ userId: "user-123" });
    });

    it("removes extra fields during validation", () => {
      const result = historyGetService.validation({
        userId: "user-123",
        extra: "should-be-removed",
      } as any);
      expect(result).toEqual({ userId: "user-123" });
    });
  });
});

describe("history.cleanup Security", () => {
  let adminCtx: RpcContext;
  let userCtx: RpcContext;

  beforeEach(() => {
    adminCtx = {
      userId: "admin-user",
      permissions: { admin: true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "admin-user", permissions: { admin: true } },
    };

    userCtx = {
      userId: "regular-user",
      permissions: { "vault.get": true },
      params: {},
      query: {},
      headers: new Headers(),
      tokenPayload: { sub: "regular-user", permissions: { "vault.get": true } },
    };

    vi.clearAllMocks();
  });

  describe("Permission Enforcement", () => {
    it("requires admin permission", () => {
      expect(historyCleanupService.requiredPermission).toContain("admin");
    });

    it("service is not public", () => {
      expect(historyCleanupService.isPublic).toBe(false);
    });
  });

  describe("Cleanup Logic", () => {
    it("deletes history older than 30 days", async () => {
      const mockDb = db as any;
      mockDb.deleteFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue({ numDeletedRows: 5 });

      const result = await historyCleanupService.handler({}, adminCtx);

      expect(result.count).toBe(5);
      expect(mockDb.deleteFrom).toHaveBeenCalledWith("history");
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("returns 0 if no records deleted", async () => {
      const mockDb = db as any;
      mockDb.deleteFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue(null);

      const result = await historyCleanupService.handler({}, adminCtx);

      expect(result.count).toBe(0);
    });

    it("handles undefined numDeletedRows", async () => {
      const mockDb = db as any;
      mockDb.deleteFrom.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.executeTakeFirst.mockResolvedValue({});

      const result = await historyCleanupService.handler({}, adminCtx);

      expect(result.count).toBe(0);
    });
  });

  describe("Input Validation", () => {
    it("accepts empty request", () => {
      const result = historyCleanupService.validation({});
      expect(result).toEqual({});
    });
  });

  describe("Admin-Only Access", () => {
    it("should only be callable by users with admin permission (permission check done by RPC handler)", () => {
      // The actual permission enforcement is done by the RPC handler
      // This test documents the expected behavior
      expect(historyCleanupService.requiredPermission).toContain("admin");
    });
  });
});
