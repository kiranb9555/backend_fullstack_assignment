import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[1-9]\d{9,14}$/,
    "Mobile must be in valid phone format"
  );

export const sendOtpSchema = z.object({
  mobile: phoneSchema
});

export const verifyOtpSchema = z.object({
  mobile: phoneSchema,

  otp: z
    .string()
    .length(6)
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});

export const logoutSchema = z.object({
  refreshToken: z.string()
});