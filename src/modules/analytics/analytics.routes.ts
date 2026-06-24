import { Router } from "express";

import { AnalyticsController } from "./analytics.controller.js";
import { validateToken } from "../../middleware/validateToken.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

const controller =
  new AnalyticsController();

router.use(validateToken);

router.get(
  "/summary",
  asyncHandler(
    controller.getSummary
  )
);

export default router;