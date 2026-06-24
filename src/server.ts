import http from "http";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./logger/logger.js";
import { initializeSocket } from "./socket/socket.js";
import { scheduleContactCleanup } from "./jobs/scheduleContactCleanup.js";
import { startWorkers } from "./workers/index.js";

const server = http.createServer(app);

initializeSocket(server);

const start = async () => {
  startWorkers();
  await scheduleContactCleanup();

  server.listen(env.port, () => {
    logger.info({
      event: "server_started",
      port: env.port
    });
  });
};

void start();