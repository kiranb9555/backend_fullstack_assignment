import Redis from "ioredis";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __nexusdialRedis__: Redis | undefined;
}

export const redis =
  global.__nexusdialRedis__ ??
  new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });

if (process.env.NODE_ENV !== "production") {
  global.__nexusdialRedis__ = redis;
}