import { Request, Response } from "express";

export const notFoundMiddleware = (
  _req: Request,
  res: Response
) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ND_4041",
      message: "Route not found"
    }
  });
};