import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "virtual:remix/server-build";

const handleRequest = createRequestHandler(build);

export default {
  fetch(request: Request, env: Env) {
    return handleRequest(request, { env });
  },
};
