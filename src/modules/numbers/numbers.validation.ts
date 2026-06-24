import { z } from "zod";

export const createNumberSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(100)
});

export const updateNumberSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  isActive: z
    .boolean()
    .optional()
});