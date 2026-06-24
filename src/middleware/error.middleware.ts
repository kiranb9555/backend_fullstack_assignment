import { Request } from "express";
import { Response } from "express";
import { NextFunction } from "express";

import { AppError } from "../common/errors/AppError.js";

import { logger } from "../logger/logger.js";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method
  });

  if (error instanceof AppError) {

    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });

    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};