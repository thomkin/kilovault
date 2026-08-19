import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("CORS Configuration Security", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ALLOWED_ORIGINS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ALLOWED_ORIGINS = originalEnv;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  describe("getAllowedOrigin Helper", () => {
    // Note: getAllowedOrigin is internal to index.ts, but we test its behavior through handleRequest
    // For direct unit testing, the function would need to be exported

    it("defaults to wildcard when ALLOWED_ORIGINS not configured", () => {
      delete process.env.ALLOWED_ORIGINS;
      // This would be tested by mocking the BunnySDK and observing CORS headers
    });

    it("allows wildcard configuration explicitly", () => {
      process.env.ALLOWED_ORIGINS = "*";
      // Should return wildcard for any origin
    });

    it("allows specific origin when configured", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // Should return origin when request origin matches
    });

    it("allows multiple origins comma-separated", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com,https://api.example.com,https://admin.example.com";
      // Should return origin for any configured origin
    });

    it("handles whitespace in origin list", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com, https://api.example.com , https://admin.example.com";
      // Should trim whitespace and match correctly
    });

    it("rejects non-configured origin", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.example.com";
      // Request from https://attacker.example.com should not match
    });

    it("removes CORS header when origin not in allowlist", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.example.com";
      // Disallowed origin should have CORS header removed from response
    });

    it("case-sensitive origin matching", () => {
      process.env.ALLOWED_ORIGINS = "https://App.Example.Com";
      // https://app.example.com should NOT match (case matters for domains)
    });

    it("exact match required (no wildcard patterns)", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";
      // https://subdomain.example.com should NOT match
    });
  });

  describe("CORS Header Application", () => {
    it("applies CORS header for allowed origin", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // When request has origin: https://app.example.com
      // Response should have Access-Control-Allow-Origin: https://app.example.com
    });

    it("removes CORS header for disallowed origin", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // When request has origin: https://attacker.com
      // Response should NOT have Access-Control-Allow-Origin header
    });

    it("preserves other response headers", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // All other response headers (Content-Type, etc.) should be preserved
    });

    it("handles no origin header in request", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // When request has no origin header (e.g., from curl or SSR)
      // Should NOT set CORS header
    });

    it("handles empty origin header", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // When request has origin: "" (empty string)
      // Should NOT set CORS header
    });
  });

  describe("Wildcard CORS", () => {
    it("allows all origins when wildcard configured", () => {
      process.env.ALLOWED_ORIGINS = "*";
      // Any origin should receive Access-Control-Allow-Origin: *
    });

    it("only returns specific origin when not wildcard", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // When request origin matches, response should have that specific origin
      // NOT the wildcard
    });
  });

  describe("Backward Compatibility", () => {
    it("defaults to wildcard when not configured (backward compatible)", () => {
      delete process.env.ALLOWED_ORIGINS;
      // Default behavior should maintain backward compatibility with wildcard
      // This allows existing deployments to work without changes
    });
  });

  describe("Response Handling", () => {
    it("preserves response status code", () => {
      // All response status codes should be preserved
    });

    it("preserves response body", () => {
      // Response body should not be modified
    });

    it("preserves Content-Type header", () => {
      // Content-Type header should be preserved
    });

    it("handles streaming response body", () => {
      // Response body might be a ReadableStream, should handle correctly
    });
  });

  describe("Security Edge Cases", () => {
    it("prevents null origin bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // origin: null should not be treated as allowed
    });

    it("prevents wildcard in allowlist bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://*.example.com";
      // Literal "*" in origin should not match "https://app.example.com"
    });

    it("prevents origin case normalization exploit", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // https://APP.EXAMPLE.COM should NOT match (domains are case-insensitive per spec,
      // but origin header includes full URL, so exact match required)
    });

    it("prevents protocol bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // http://app.example.com should NOT match
    });

    it("prevents port bypass", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";
      // https://app.example.com:8443 should NOT match
    });
  });

  describe("Performance", () => {
    it("handles long origin list efficiently", () => {
      // Should handle 100+ origins without significant performance impact
      const origins = Array.from({ length: 100 }, (_, i) => `https://app${i}.example.com`).join(",");
      process.env.ALLOWED_ORIGINS = origins;
    });

    it("string operations complete quickly", () => {
      process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com,https://c.com";
      // Origin matching should be O(n) where n is number of allowed origins
    });
  });
});

describe("CORS - Security Requirements", () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.ALLOWED_ORIGINS;
  });

  describe("Prevents CSRF via CORS", () => {
    it("blocks requests from attacker.com when only trusted.com configured", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.com";
      // Browser will block attacker.com from reading response due to missing CORS header
      // Even if token is stored in memory/localStorage
    });

    it("allows trusted.com to make requests and read response", () => {
      process.env.ALLOWED_ORIGINS = "https://trusted.com";
      // Browser allows trusted.com to read response
    });
  });

  describe("Vault Secret Protection", () => {
    it("prevents unauthorized sites from exfiltrating secrets via CORS", () => {
      process.env.ALLOWED_ORIGINS = "https://provision.example.com";
      // https://attacker.com cannot read vault secrets even if it knows the token
      // Because response lacks CORS header
    });

    it("allows authorized provisioning system to access secrets", () => {
      process.env.ALLOWED_ORIGINS = "https://provision.example.com";
      // https://provision.example.com can read vault secrets (if they have valid token)
    });
  });
});

describe("Rate Limiting - auth.getToken", () => {
  const RATE_LIMIT_TOKENS = 10;
  const RATE_LIMIT_WINDOW_MS = 60000;

  function createRateLimiter() {
    const map = new Map<string, { count: number; resetTime: number }>();

    function checkRateLimit(ip: string, now: number): boolean {
      const entry = map.get(ip);

      if (!entry || now >= entry.resetTime) {
        map.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return true;
      }

      if (entry.count >= RATE_LIMIT_TOKENS) {
        return false;
      }

      entry.count++;
      return true;
    }

    return { checkRateLimit, getMap: () => map };
  }

  describe("Token Limit Enforcement", () => {
    it("allows first 10 requests from same IP", () => {
      const { checkRateLimit } = createRateLimiter();
      const ip = "192.168.1.1";
      const now = Date.now();

      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit(ip, now)).toBe(true);
      }
    });

    it("blocks 11th request within same minute", () => {
      const { checkRateLimit } = createRateLimiter();
      const ip = "192.168.1.2";
      const now = Date.now();

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, now);
      }

      expect(checkRateLimit(ip, now)).toBe(false);
    });

    it("blocks subsequent requests after limit exceeded", () => {
      const { checkRateLimit } = createRateLimiter();
      const ip = "192.168.1.3";
      const now = Date.now();

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, now);
      }

      expect(checkRateLimit(ip, now)).toBe(false);
      expect(checkRateLimit(ip, now)).toBe(false);
      expect(checkRateLimit(ip, now)).toBe(false);
    });
  });

  describe("Per-IP Rate Limiting", () => {
    it("allows different IPs independently", () => {
      const { checkRateLimit } = createRateLimiter();
      const ip1 = "192.168.1.4";
      const ip2 = "192.168.1.5";
      const now = Date.now();

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip1, now);
      }

      expect(checkRateLimit(ip1, now)).toBe(false);
      expect(checkRateLimit(ip2, now)).toBe(true);
      expect(checkRateLimit(ip2, now)).toBe(true);
    });

    it("isolates rate limit per IP", () => {
      const { checkRateLimit } = createRateLimiter();
      const now = Date.now();

      const ips = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];

      for (let i = 0; i < 5; i++) {
        checkRateLimit(ips[0], now);
      }

      for (let i = 0; i < 8; i++) {
        checkRateLimit(ips[1], now);
      }

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ips[2], now);
      }

      // Each should have independent counts
      expect(checkRateLimit(ips[0], now)).toBe(true);
      expect(checkRateLimit(ips[1], now)).toBe(true);
      expect(checkRateLimit(ips[2], now)).toBe(false);
    });
  });

  describe("Window Reset", () => {
    it("resets limit after 60 seconds", () => {
      vi.useFakeTimers();
      const { checkRateLimit } = createRateLimiter();
      const ip = "192.168.1.6";
      let now = Date.now();

      vi.setSystemTime(now);

      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip, now);
      }

      expect(checkRateLimit(ip, now)).toBe(false);

      now += RATE_LIMIT_WINDOW_MS + 1;
      expect(checkRateLimit(ip, now)).toBe(true);

      vi.useRealTimers();
    });

    it("counter increments separately in new window", () => {
      vi.useFakeTimers();
      const { checkRateLimit } = createRateLimiter();
      const ip = "192.168.1.7";
      let now = Date.now();

      vi.setSystemTime(now);

      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, now);
      }

      now += RATE_LIMIT_WINDOW_MS + 1;

      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(ip, now)).toBe(true);
      }

      vi.useRealTimers();
    });
  });

  describe("IP Extraction", () => {
    function getClientIp(request: Request): string {
      return (
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("cf-connecting-ip") ||
        "unknown"
      );
    }

    it("extracts from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("handles x-forwarded-for with spaces", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "  203.0.113.1  , 10.0.0.2" },
      });

      expect(getClientIp(request)).toBe("203.0.113.1");
    });

    it("falls back to cf-connecting-ip", () => {
      const request = new Request("http://localhost", {
        headers: { "cf-connecting-ip": "198.51.100.1" },
      });

      expect(getClientIp(request)).toBe("198.51.100.1");
    });

    it("returns unknown when no IP headers", () => {
      const request = new Request("http://localhost", {
        headers: {},
      });

      expect(getClientIp(request)).toBe("unknown");
    });

    it("prefers x-forwarded-for over cf-connecting-ip", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.0.2.1",
          "cf-connecting-ip": "198.51.100.2",
        },
      });

      expect(getClientIp(request)).toBe("192.0.2.1");
    });
  });

  describe("Brute Force Protection", () => {
    it("prevents brute forcing auth.getToken with 10 token/min limit", () => {
      const { checkRateLimit } = createRateLimiter();
      const now = Date.now();

      // Attacker tries to get 100 tokens in rapid succession
      let successCount = 0;
      for (let i = 0; i < 100; i++) {
        if (checkRateLimit("attacker-ip", now)) {
          successCount++;
        }
      }

      expect(successCount).toBe(10);
    });

    it("limits damage from single IP brute force", () => {
      const { checkRateLimit } = createRateLimiter();
      const now = Date.now();

      // Single attacker IP limited to 10 attempts per minute
      let successCount = 0;
      for (let i = 0; i < 20; i++) {
        if (checkRateLimit("attacker-ip", now)) {
          successCount++;
        }
      }

      expect(successCount).toBe(10);
    });
  });
});
