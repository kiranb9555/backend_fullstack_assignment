import { z } from "zod";

export const getContactsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  tag: z.string().trim().min(1).optional(),
  minCallCount: z.coerce.number().int().min(0).optional(),
  firstSeenFrom: z.string().datetime().optional(),
  firstSeenTo: z.string().datetime().optional()
});

export const updateContactSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  addTags: z.array(z.string().trim().min(1).max(50)).optional(),
  removeTags: z.array(z.string().trim().min(1).max(50)).optional()
});