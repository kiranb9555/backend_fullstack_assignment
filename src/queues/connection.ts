import Redis from "ioredis";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __nexusdialQueueRedis__: Redis | undefined;
}

export const queueConnection =
  global.__nexusdialQueueRedis__ ??
  new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

if (process.env.NODE_ENV !== "production") {
  global.__nexusdialQueueRedis__ = queueConnection;
}