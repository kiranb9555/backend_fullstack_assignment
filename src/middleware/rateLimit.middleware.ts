import rateLimit, {
  ipKeyGenerator
} from "express-rate-limit";
import {
  RedisStore,
  type RedisReply
} from "rate-limit-redis";

import { redis } from "../redis/redis.js";

const buildRedisStore = (prefix: string) =>
  new RedisStore({
    prefix,
    // ioredis exposes send_command with this signature.
    sendCommand: (...args: string[]) =>
      redis.call(
        args[0],
        ...args.slice(1)
      ) as Promise<RedisReply>
  });

export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore("rl:otp:"),
  keyGenerator: req =>
    typeof req.body?.mobile === "string" &&
    req.body.mobile.trim().length > 0
      ? `mobile:${req.body.mobile.trim()}`
      : ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    success: false,
    error: {
      code: "ND_4290",
      message:
        "Too many OTP requests for this mobile. Try again later."
    }
  }
});

export const tenantApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore("rl:tenant:"),
  keyGenerator: req =>
    req.tenant?.id
      ? `tenant:${req.tenant.id}`
      : ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    success: false,
    error: {
      code: "ND_4291",
      message:
        "Too many requests for this tenant. Try again later."
    }
  }
});
