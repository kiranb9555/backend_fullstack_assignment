import http from "http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/socket.js";
import { logger } from "./logger/logger.js";

import "./workers/index.js";

import { scheduleContactCleanup } from "./jobs/scheduleContactCleanup.js";

const server =
  http.createServer(app);

initializeSocket(server);

const start = async () => {
  await scheduleContactCleanup();

  server.listen(
    env.port,
    () => {
      logger.info({
        event: "server_started",
        port: env.port
      });
    }
  );
};

void start();