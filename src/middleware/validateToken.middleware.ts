import { NextFunction, Request, Response } from "express";

import { prisma } from "../db/prisma.js";
import { UnauthorizedError } from "../common/errors/UnauthorizedError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const validateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader =
    req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError("Missing bearer token")
    );
  }

  const token =
    authHeader.replace("Bearer ", "").trim();

  try {
    const payload =
      verifyAccessToken(token);

    const tenant =
      await prisma.tenant.findUnique({
        where: {
          id: payload.tenantId
        }
      });

    if (!tenant) {
      return next(
        new UnauthorizedError("Tenant not found")
      );
    }

    req.auth = {
      tenantId: payload.tenantId
    };

    req.tenant = tenant;

    return next();
  } catch {
    return next(
      new UnauthorizedError("Invalid token")
    );
  }
};