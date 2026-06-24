import { Request, Response, NextFunction } from "express";

export const requireTenant = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  if (!req.tenant) {
    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
    return;
  }

  next();
};