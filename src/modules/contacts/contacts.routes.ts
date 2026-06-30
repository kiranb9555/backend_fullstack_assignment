import { Router } from "express";

import { ContactsController } from "./contacts.controller.js";
import { validateToken } from "../../middleware/validateToken.middleware.js";
import { tenantApiRateLimit } from "../../middleware/rateLimit.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateRequest } from "../../middleware/validateRequest.middleware.js";

import {
  getContactsSchema,
  updateContactSchema
} from "./contacts.validation.js";

const router = Router();

const controller =
  new ContactsController();

router.use(validateToken);
router.use(tenantApiRateLimit);

router.get(
  "/",
  validateRequest(getContactsSchema),
  asyncHandler(
    controller.getContacts
  )
);

router.get(
  "/:id",
  asyncHandler(
    controller.getContactById
  )
);

router.get(
  "/:id/timeline",
  asyncHandler(
    controller.getContactTimeline
  )
);

router.patch(
  "/:id",
  validateRequest(updateContactSchema),
  asyncHandler(
    controller.updateContact
  )
);

router.delete(
  "/:id",
  asyncHandler(
    controller.deleteContact
  )
);

export default router;