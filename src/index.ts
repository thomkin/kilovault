import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { handleRequest } from "@crunch/index";

const PORT = 5096;
BunnySDK.net.http.serve({ port: PORT, hostname: "0.0.0.0" }, (req) => {
  return handleRequest(req, {
    rpcOnly: true,
  });
});
