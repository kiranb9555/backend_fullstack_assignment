import { Router } from "express";

import { SimulateController } from "./simulate.controller.js";

import { validateToken } from "../../middleware/validateToken.middleware.js";
import { tenantApiRateLimit } from "../../middleware/rateLimit.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { validateRequest } from "../../middleware/validateRequest.middleware.js";

import { simulateCallSchema } from "./simulate.validation.js";

const router = Router();

const controller =
  new SimulateController();

router.use(validateToken);
router.use(tenantApiRateLimit);

router.post(
  "/call",

  validateRequest(
    simulateCallSchema
  ),

  asyncHandler(
    controller.createCall
  )
);

export default router;