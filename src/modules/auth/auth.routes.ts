import { Router } from "express";

import { AuthController } from "./auth.controller.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  logoutSchema
} from "./auth.validation.js";

import { validateRequest } from "../../middleware/validateRequest.middleware.js";
import { otpRateLimit } from "../../middleware/rateLimit.middleware.js";

const router = Router();

const controller = new AuthController();

router.post(
  "/send-otp",

  otpRateLimit,

  validateRequest(
    sendOtpSchema
  ),

  asyncHandler(
    controller.sendOtp
  )
);

router.post(
  "/verify-otp",

  validateRequest(
    verifyOtpSchema
  ),

  asyncHandler(
    controller.verifyOtp
  )
);

router.post(
  "/refresh",

  validateRequest(
    refreshSchema
  ),

  asyncHandler(
    controller.refresh
  )
);

router.post(
  "/logout",

  validateRequest(
    logoutSchema
  ),

  asyncHandler(
    controller.logout
  )
);

export default router;