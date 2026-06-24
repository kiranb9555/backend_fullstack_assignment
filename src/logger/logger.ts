import winston from "winston";
import { env } from "../config/env.js";

export const logger = winston.createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.json(),
  defaultMeta: {
    service: "nexusdial-backend"
  },
  transports: [
    new winston.transports.Console()
  ]
});