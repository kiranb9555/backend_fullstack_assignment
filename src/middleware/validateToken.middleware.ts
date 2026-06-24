import {
  Request,
  Response,
  NextFunction
} from "express";

import { prisma } from "../db/prisma.js";

import {
  verifyAccessToken
} from "../utils/jwt.js";

import { UnauthorizedError } from "../common/errors/UnauthorizedError.js";

export const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError(
      "Authorization header missing"
    );
  }

  const token =
    authHeader.replace(
      "Bearer ",
      ""
    );

  const payload =
    verifyAccessToken(
      token
    );

  const tenant =
    await prisma.tenant.findUnique({
      where: {
        id: payload.tenantId
      }
    });

  if (!tenant) {
    throw new UnauthorizedError(
      "Tenant not found"
    );
  }

  req.tenant = tenant;

  next();
};