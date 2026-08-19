import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;
const RATE_LIMIT_TOKENS = 10; // tokens per minute
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// Rate limiter: track auth.getToken calls per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_TOKENS) {
    return false;
  }

  entry.count++;
  return true;
}

function getAllowedOrigin(request: Request): string {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  if (!allowedOrigins) {
    return "*"; // Fallback to wildcard if not configured
  }

  if (allowedOrigins === "*") {
    return "*";
  }

  const requestOrigin = request.headers.get("origin");
  const originsList = allowedOrigins.split(",").map((o) => o.trim());

  if (requestOrigin && originsList.includes(requestOrigin)) {
    return requestOrigin;
  }

  return "";
}

async function handleRequest(
  req: Request,
  options: { rpcOnly?: boolean; enableHttp?: boolean },
): Promise<Response> {
  // Check rate limit for auth.getToken
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        const body = await req.clone().json();
        if (body.method === "auth.getToken") {
          const clientIp = getClientIp(req);
          if (!checkRateLimit(clientIp)) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                error: {
                  code: -32000,
                  message: "Rate limit exceeded",
                },
                id: body.id || null,
              }),
              {
                status: 429,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        }
      } catch {
        // Continue if body parsing fails (not JSON)
      }
    }
  }

  const response = await crunchHandleRequest(req, options);

  // Apply configurable CORS headers
  const origin = getAllowedOrigin(req);
  const newHeaders = new Headers(response.headers);

  if (origin) {
    newHeaders.set("Access-Control-Allow-Origin", origin);
  } else {
    // Remove wildcard CORS header if origin not allowed
    newHeaders.delete("Access-Control-Allow-Origin");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
