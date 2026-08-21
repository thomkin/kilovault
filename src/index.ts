import * as BunnySDK from "@bunny.net/edgescript-sdk";

const PORT = 5096;

console.log("[STARTUP] Kilovault test server starting");
let requestCount = 0;

async function handleRequest(req: Request): Promise<Response> {
  requestCount++;
  const reqId = requestCount;

  console.log(`[REQ #${reqId}] ${req.method} ${new URL(req.url).pathname}`);

  try {
    // For POST requests, log the body
    if (req.method === "POST") {
      try {
        const body = await req.clone().json();
        console.log(`[REQ #${reqId}] Body: ${JSON.stringify(body)}`);
      } catch (e) {
        console.log(`[REQ #${reqId}] Could not parse JSON`);
      }
    }

    console.log(`[REQ #${reqId}] Responding with 200 OK`);

    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Kilovault test server working",
        requestId: reqId,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error(`[REQ #${reqId}] Error:`, error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
        requestId: reqId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

console.log("[STARTUP] Starting HTTP server on port", PORT);

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req);
});

console.log("[STARTUP] Server ready");
