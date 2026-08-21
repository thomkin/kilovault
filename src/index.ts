import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest as crunchHandleRequest } from "@crunch/index";

const PORT = 5096;

// Minimal startup logging
console.log("[STARTUP] Kilovault server starting");
console.log("[STARTUP] Ready");


async function handleRequest(
  req: Request,
  options: { rpcOnly?: boolean; enableHttp?: boolean },
): Promise<Response> {

  return { manfred: "ok" } as any;
  // const response = await crunchHandleRequest(req, options);
  // return response;
}

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
