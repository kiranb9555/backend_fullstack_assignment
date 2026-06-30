import { z } from "zod";

export const extractedDataSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
  intent: z
    .string()
    .min(1)
    .max(200)
    .refine(
      value =>
        value
          .trim()
          .split(/\s+/)
          .filter(Boolean).length <= 20,
      {
        message:
          "Intent must contain at most 20 words"
      }
    )
    .nullable(),
  sentiment: z.enum([
    "positive",
    "neutral",
    "negative"
  ]),
  callbackRequested: z.boolean()
});

export type ExtractedData =
  z.infer<typeof extractedDataSchema>;