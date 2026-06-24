import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __nexusdialPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__nexusdialPrisma__ ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__nexusdialPrisma__ = prisma;
}