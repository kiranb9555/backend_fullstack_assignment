import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),

  databaseUrl: process.env.DATABASE_URL ?? "",

  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),

  accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",

  openAiKey: process.env.OPENAI_API_KEY ?? "",
  geminiKey: process.env.GEMINI_API_KEY ?? ""
};