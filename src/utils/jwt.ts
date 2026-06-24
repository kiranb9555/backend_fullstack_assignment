import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  tenantId: string;
}

export interface RefreshTokenPayload {
  tenantId: string;
  tokenId: string;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
) => {
  return jwt.sign(
    payload,
    env.jwtAccessSecret,
    {
      expiresIn: "15m"
    }
  );
};

export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  return jwt.verify(
    token,
    env.jwtAccessSecret
  ) as AccessTokenPayload;
};

export const generateRefreshToken = (
  payload: RefreshTokenPayload
) => {
  return jwt.sign(
    payload,
    env.jwtRefreshSecret,
    {
      expiresIn: "30d"
    }
  );
};

export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  return jwt.verify(
    token,
    env.jwtRefreshSecret
  ) as RefreshTokenPayload;
};