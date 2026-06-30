import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[1-9]\d{9,14}$/,
    "callerMobile must be in valid phone format"
  );

export const simulateCallSchema = z.object({
  virtualNumberId: z.string().uuid(),

  callerMobile: phoneSchema,

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