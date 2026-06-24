import { z } from "zod";

export const extractedDataSchema = z.object({
  name: z.string().min(1).max(100).nullable(),
  intent: z.string().min(1).max(120).nullable(),
  sentiment: z.enum([
    "positive",
    "neutral",
    "negative"
  ]),
  callbackRequested: z.boolean()
});

export type ExtractedData =
  z.infer<typeof extractedDataSchema>;