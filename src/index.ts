import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;

// Minimal startup logging
console.log("[STARTUP] Kilovault server starting");
console.log("[STARTUP] Ready");

// Resolves the Access-Control-Allow-Origin value for a given request Origin,
// based on ALLOWED_ORIGINS (comma-separated exact-match list, or "*").
// Returns null when the origin should NOT get a CORS header at all.
export function getAllowedOrigin(requestOrigin: string | null): string | null {
  const configured = Deno.env.get("ALLOWED_ORIGINS");

  if (!configured || configured === "*") {
    return "*";
  }

  if (!requestOrigin) {
    return null;
  }

  const allowList = configured.split(",").map((o) => o.trim());
  return allowList.includes(requestOrigin) ? requestOrigin : null;
}

export function corsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {};
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin,
  };
  // Required whenever a specific (non-"*") origin is reflected, so CDN/
  // browser caches don't serve one origin's cached response to another.
  if (allowedOrigin !== "*") {
    headers["Vary"] = "Origin";
  }
  return headers;
}

export async function handleRequest(
  req: Request,
  options: { rpcOnly?: boolean; enableHttp?: boolean },
): Promise<Response> {
  const allowedOrigin = getAllowedOrigin(req.headers.get("Origin"));

  // Preflight — answered directly, never forwarded to crunch.ts.
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders(allowedOrigin),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const response = await crunchHandleRequest(req, options);

  // Rewrite whatever CORS header crunch.ts's build output set internally.
  const headers = new Headers(response.headers);
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Vary");
  for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
