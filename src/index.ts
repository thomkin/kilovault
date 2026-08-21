import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;

// Minimal startup logging
console.log("[STARTUP] Kilovault server starting");
console.log("[STARTUP] Ready");

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
