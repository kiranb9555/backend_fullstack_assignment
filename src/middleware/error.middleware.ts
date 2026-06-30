import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../common/errors/AppError.js";
import { logger } from "../logger/logger.js";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "ND_4001",
        message: "Validation failed",
        details: error.flatten()
      }
    });
  }

  const err =
    error instanceof Error
      ? error
      : new Error("Unknown server error");

  if (
    err instanceof SyntaxError &&
    err.message.includes("JSON")
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "ND_4002",
        message:
          "Invalid JSON body. For refresh, send: {\"refreshToken\":\"<token-from-verify-otp>\"}"
      }
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  logger.error({
    event: "unhandled_error",
    message: err.message,
    stack: err.stack
  });

  return res.status(500).json({
    success: false,
    error: {
      code: "ND_5001",
      message: "Something went wrong"
    }
  });
};