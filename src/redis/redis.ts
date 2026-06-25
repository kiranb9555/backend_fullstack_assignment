import IORedis from "ioredis";
import { env } from "../config/env.js";

const createRedis = () => {
  return new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
};

type RedisClient = ReturnType<typeof createRedis>;

declare global {
  // eslint-disable-next-line no-var
  var __nexusdialRedis__: RedisClient | undefined;
}

export const redis: RedisClient =
  global.__nexusdialRedis__ ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  global.__nexusdialRedis__ = redis;
}