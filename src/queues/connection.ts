import { Redis } from "ioredis";
import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __nexusdialQueueRedis__: ConnectionOptions | undefined;
}

const createQueueConnection = (): ConnectionOptions =>
  new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }) as ConnectionOptions;

export const queueConnection: ConnectionOptions =
  global.__nexusdialQueueRedis__ ?? createQueueConnection();

if (process.env.NODE_ENV !== "production") {
  global.__nexusdialQueueRedis__ = queueConnection;
}