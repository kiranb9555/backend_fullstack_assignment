import { Router } from "express";

import { NumbersController } from "./numbers.controller.js";

import { validateToken } from "../../middleware/validateToken.middleware.js";
import { tenantApiRateLimit } from "../../middleware/rateLimit.middleware.js";

import { asyncHandler } from "../../utils/asyncHandler.js";

import { validateRequest } from "../../middleware/validateRequest.middleware.js";

import {
  createNumberSchema,
  updateNumberSchema
} from "./numbers.validation.js";

const router = Router();

const controller =
  new NumbersController();

router.use(validateToken);
router.use(tenantApiRateLimit);

router.get(
  "/",
  asyncHandler(
    controller.getNumbers
  )
);

router.get(
  "/:id",
  asyncHandler(
    controller.getNumberById
  )
);

router.post(
  "/",
  validateRequest(
    createNumberSchema
  ),
  asyncHandler(
    controller.createNumber
  )
);

router.patch(
  "/:id",
  validateRequest(
    updateNumberSchema
  ),
  asyncHandler(
    controller.updateNumber
  )
);

export default router;