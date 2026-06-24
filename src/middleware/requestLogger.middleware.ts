import { Request, Response, NextFunction } from "express";

import { logger } from "../logger/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    });
  });

  next();
};