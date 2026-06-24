import { RedisOptions } from "ioredis";

import { env } from "../config/env.js";

export const queueConnection: RedisOptions = {
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null
};