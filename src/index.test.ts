import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { mockCrunchHandleRequest } = vi.hoisted(() => ({
  mockCrunchHandleRequest: vi.fn(),
}));

vi.mock("@bunny.net/edgescript-sdk", () => ({
  net: { http: { serve: vi.fn() } },
}));

vi.mock("@crunch/index", () => ({
  handleRequest: mockCrunchHandleRequest,
}));

vi.stubGlobal("Deno", {
  env: { get: (key: string) => process.env[key] },
});

import { getAllowedOrigin, corsHeaders, handleRequest } from "./index";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...(init?.headers ?? {}),
    },
  });
}

function rpcRequest(origin?: string | null): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers["Origin"] = origin;
  return new Request("http://localhost:5096/rpc", {
    method: "POST",
    headers,
    body: JSON.stringify({ method: "system.alive", params: {} }),
  });
}

describe("CORS Configuration Security", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ALLOWED_ORIGINS;
    mockCrunchHandleRequest.mockReset();
    mockCrunchHandleRequest.mockResolvedValue(jsonResponse({ result: { timestamp: 1 } }));
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ALLOWED_ORIGINS = originalEnv;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  describe("getAllowedOrigin Helper", () => {
    it("defaults to wildcard when ALLOWED_ORIGINS not configured", () => {
      delete process.env.ALLOWED_ORIGINS;
      expect(getAllowedOrigin("https://anything.example.com")).toBe("*");
    });

    it("allows wildcard configuration explicitly", () => {
      process.env.ALLOWED_ORIGINS = "*";
      expect(getAllowedOrigin("https://anything.example.com")).toBe("*");
    });

    it("allows specific origin when configured", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin("https://app.example.com")).toBe("https://app.example.com");
    });

    it("allows multiple origins comma-separated", () => {
      process.env.ALLOWED_ORIGINS =
        "https://app.example.com,https://api.example.com,https://admin.example.com";
      expect(getAllowedOrigin("https://api.example.com")).toBe("https://api.example.com");
    });

    it("handles whitespace in origin list", () => {
      process.env.ALLOWED_ORIGINS =
        "https://app.example.com, https://api.example.com , https://admin.example.com";
      expect(getAllowedOrigin("https://api.example.com")).toBe("https://api.example.com");
    });

    it("rejects non-configured origin", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.example.com";
      expect(getAllowedOrigin("https://attacker.example.com")).toBeNull();
    });

    it("removes CORS header when origin not in allowlist", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.example.com";
      expect(corsHeaders(getAllowedOrigin("https://attacker.example.com"))).toEqual({});
    });

    it("case-sensitive origin matching", () => {
      process.env.ALLOWED_ORIGINS = "https://App.Example.Com";
      expect(getAllowedOrigin("https://app.example.com")).toBeNull();
    });

    it("exact match required (no wildcard patterns)", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";
      expect(getAllowedOrigin("https://subdomain.example.com")).toBeNull();
    });
  });

  describe("CORS Header Application", () => {
    it("applies CORS header for allowed origin", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
    });

    it("removes CORS header for disallowed origin", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      const res = await handleRequest(rpcRequest("https://attacker.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("preserves other response headers", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(res.headers.get("Content-Type")).toBe("application/json");
    });

    it("handles no origin header in request", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      const res = await handleRequest(rpcRequest(null), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("handles empty origin header", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin("")).toBeNull();
    });
  });

  describe("Wildcard CORS", () => {
    it("allows all origins when wildcard configured", async () => {
      process.env.ALLOWED_ORIGINS = "*";
      const res = await handleRequest(rpcRequest("https://random-site.example"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("only returns specific origin when not wildcard", async () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
      expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
    });
  });

  describe("Backward Compatibility", () => {
    it("defaults to wildcard when not configured (backward compatible)", async () => {
      delete process.env.ALLOWED_ORIGINS;
      const res = await handleRequest(rpcRequest("https://anything.example"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("Response Handling", () => {
    beforeEach(() => {
      delete process.env.ALLOWED_ORIGINS;
    });

    it("preserves response status code", async () => {
      mockCrunchHandleRequest.mockResolvedValue(
        jsonResponse({ error: "Forbidden" }, { status: 403 }),
      );
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(res.status).toBe(403);
    });

    it("preserves response body", async () => {
      mockCrunchHandleRequest.mockResolvedValue(jsonResponse({ result: { ok: true } }));
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(await res.json()).toEqual({ result: { ok: true } });
    });

    it("preserves Content-Type header", async () => {
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(res.headers.get("Content-Type")).toBe("application/json");
    });

    it("handles streaming response body", async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"result":"streamed"}'));
          controller.close();
        },
      });
      mockCrunchHandleRequest.mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }),
      );
      const res = await handleRequest(rpcRequest("https://app.example.com"), { rpcOnly: true });
      expect(await res.text()).toBe('{"result":"streamed"}');
    });
  });

  describe("Security Edge Cases", () => {
    it("prevents null origin bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin(null)).toBeNull();
    });

    it("prevents wildcard in allowlist bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://*.example.com";
      expect(getAllowedOrigin("https://app.example.com")).toBeNull();
    });

    it("prevents origin case normalization exploit", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin("https://APP.EXAMPLE.COM")).toBeNull();
    });

    it("prevents protocol bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin("http://app.example.com")).toBeNull();
    });

    it("prevents port bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      expect(getAllowedOrigin("https://app.example.com:8443")).toBeNull();
    });
  });

  describe("Performance", () => {
    it("handles long origin list efficiently", () => {
      const origins = Array.from({ length: 100 }, (_, i) => `https://app${i}.example.com`).join(",");
      process.env.ALLOWED_ORIGINS = origins;
      expect(getAllowedOrigin("https://app50.example.com")).toBe("https://app50.example.com");
      expect(getAllowedOrigin("https://not-in-list.example.com")).toBeNull();
    });

    it("string operations complete quickly", () => {
      process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com,https://c.com";
      expect(getAllowedOrigin("https://b.com")).toBe("https://b.com");
    });
  });
});

describe("CORS Preflight (OPTIONS)", () => {
  beforeEach(() => {
    mockCrunchHandleRequest.mockReset();
    mockCrunchHandleRequest.mockResolvedValue(jsonResponse({ result: { timestamp: 1 } }));
  });

  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it("never forwards OPTIONS requests to crunch.ts", async () => {
    const req = new Request("http://localhost:5096/rpc", {
      method: "OPTIONS",
      headers: { Origin: "https://app.example.com" },
    });
    await handleRequest(req, { rpcOnly: true });
    expect(mockCrunchHandleRequest).not.toHaveBeenCalled();
  });

  it("responds to preflight with the resolved origin and allowed methods/headers", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const req = new Request("http://localhost:5096/rpc", {
      method: "OPTIONS",
      headers: { Origin: "https://app.example.com" },
    });
    const res = await handleRequest(req, { rpcOnly: true });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
  });
});

describe("CORS - Security Requirements", () => {
  beforeEach(() => {
    delete process.env.ALLOWED_ORIGINS;
    mockCrunchHandleRequest.mockReset();
    mockCrunchHandleRequest.mockResolvedValue(jsonResponse({ result: { timestamp: 1 } }));
  });

  describe("Prevents CSRF via CORS", () => {
    it("blocks requests from attacker.com when only trusted.com configured", async () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.com";
      const res = await handleRequest(rpcRequest("https://attacker.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("allows trusted.com to make requests and read response", async () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.com";
      const res = await handleRequest(rpcRequest("https://trusted.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://trusted.com");
    });
  });

  describe("Vault Secret Protection", () => {
    it("prevents unauthorized sites from exfiltrating secrets via CORS", async () => {
      process.env.ALLOWED_ORIGINS = "https://provision.example.com";
      const res = await handleRequest(rpcRequest("https://attacker.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("allows authorized provisioning system to access secrets", async () => {
      process.env.ALLOWED_ORIGINS = "https://provision.example.com";
      const res = await handleRequest(rpcRequest("https://provision.example.com"), { rpcOnly: true });
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://provision.example.com");
    });
  });
});
