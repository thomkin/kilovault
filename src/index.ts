import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;

// Log startup info
console.log("[STARTUP] Kilovault server starting");
console.log(`[STARTUP] Environment variables configured:`);
console.log(`  DB_URL first 4 chars: ${(process.env.DB_URL || "MISSING").substring(0, 4)}`);
console.log(`  DB_TOKEN first 4 chars: ${(process.env.DB_TOKEN || "MISSING").substring(0, 4)}`);
console.log(`  JWT_SECRET first 4 chars: ${(process.env.JWT_SECRET || "MISSING").substring(0, 4)}`);
console.log(`  VAULT_MASTER_PASSWORD first 4 chars: ${(process.env.VAULT_MASTER_PASSWORD || "MISSING").substring(0, 4)}`);
console.log(`  ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || "* (default)"}`);

// TODO: COMMENTED OUT FOR DEBUGGING - RESTORE AFTER CHECKING ENV VARS
/*
const response = await crunchHandleRequest(req, options);
*/

let requestCount = 0;

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
  requestCount++;
  const reqId = requestCount;
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`[REQ #${reqId}] ${method} ${path}`);
  console.log(`[REQ #${reqId}] Headers: Content-Type=${req.headers.get("content-type")}`);

  try {
    // DEBUG: Return early without processing
    console.log(`[REQ #${reqId}] Returning debug response`);
    return new Response(JSON.stringify({
      status: "debug",
      message: "Server running, env vars loaded",
      requestId: reqId
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    /* COMMENTED OUT FOR DEBUGGING
    // Log body for RPC calls
    if (method === "POST" && req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.clone().json();
        console.log(`[REQ #${reqId}] RPC Method: ${body.method}`);
        console.log(`[REQ #${reqId}] Has Token: ${body.token ? "yes" : "no"}`);
      } catch (e) {
        console.log(`[REQ #${reqId}] Failed to parse JSON body`);
      }
    }

    const response = await crunchHandleRequest(req, options);

    console.log(`[REQ #${reqId}] Response: ${response.status}`);

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
    */
  } catch (error) {
    console.error(`[REQ #${reqId}] Error:`, error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error),
      requestId: reqId
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
