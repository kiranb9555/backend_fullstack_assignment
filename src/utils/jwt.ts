import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AccessPayload {
  tenantId: string;
}

export const generateAccessToken = (
  payload: AccessPayload
): string => {
  return jwt.sign(
    payload,
    env.accessSecret,
    {
      expiresIn: "15m"
    }
  );
};

export const generateRefreshToken = (
  payload: AccessPayload
): string => {
  return jwt.sign(
    payload,
    env.refreshSecret,
    {
      expiresIn: "30d"
    }
  );
};

export const verifyAccessToken = (
  token: string
): AccessPayload => {
  return jwt.verify(
    token,
    env.accessSecret
  ) as AccessPayload;
};

export const verifyRefreshToken = (
  token: string
): AccessPayload => {
  return jwt.verify(
    token,
    env.refreshSecret
  ) as AccessPayload;
};