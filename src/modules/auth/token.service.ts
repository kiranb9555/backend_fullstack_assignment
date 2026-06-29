import { randomUUID } from "node:crypto";

import { prisma } from "../../db/prisma.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../../utils/jwt.js";

import { addDays } from "../../utils/date.js";

import { UnauthorizedError } from "../../common/errors/UnauthorizedError.js";

export class TokenService {

  async createTokens(
    tenantId: string
  ) {

    const accessToken =
      generateAccessToken({
        tenantId
      });

    const tokenId = randomUUID();

    const refreshToken =
      generateRefreshToken({
        tenantId,
        tokenId
      });

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        tenantId,
        token: refreshToken,
        expiresAt: addDays(30)
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }

  async rotateRefreshToken(
    token: string
  ) {

    const payload =
      verifyRefreshToken(token);

    const stored =
      await prisma.refreshToken.findUnique({
        where: {
          token
        }
      });

    if (!stored) {
      throw new UnauthorizedError(
        "Invalid refresh token"
      );
    }

    if (
      stored.expiresAt <
      new Date()
    ) {
      throw new UnauthorizedError(
        "Refresh token expired"
      );
    }

    await prisma.refreshToken.delete({
      where: {
        token
      }
    });

    return this.createTokens(
      payload.tenantId
    );
  }
}