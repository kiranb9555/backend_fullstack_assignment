import http from "http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/socket.js";
import { logger } from "./logger/logger.js";

import "./workers/index.js";

const server =
  http.createServer(app);

initializeSocket(server);

server.listen(
  env.port,
  () => {
    logger.info({
      event: "server_started",
      port: env.port
    });
  }
);