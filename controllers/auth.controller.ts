import { Request, Response } from "express";
import { generateOtp } from "../services/otp.service";
import { logger } from "../utils/logger";

export const sendOtp = async (
  req: Request,
  res: Response
) => {

  const { mobile } = req.body;

  const otp = await generateOtp(mobile);

  logger.info({
    mobile,
    otp
  });

  return res.json({
    success: true,
    message: "OTP sent"
  });
};