import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest } from "@crunch/index";

const PORT = 5096;
console.log(`🚀 Server listening on http://localhost:${PORT}`);

BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req);
});
