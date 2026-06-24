import { z } from "zod";

export const simulateCallSchema = z.object({
  virtualNumberId: z.string().uuid(),

  callerMobile: z
    .string()
    .min(10)
    .max(20),

  direction: z.enum([
    "INBOUND",
    "OUTBOUND"
  ]),

  durationSec: z
    .number()
    .int()
    .min(0),

  hasVoicemail: z.boolean()
});