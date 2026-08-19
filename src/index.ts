import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;

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
  if (origin) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", origin);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
}

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
