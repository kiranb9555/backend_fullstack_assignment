import { z } from "zod";

export const sendOtpSchema = z.object({
  mobile: z
    .string()
    .min(10)
    .max(15)
});

export const verifyOtpSchema = z.object({
  mobile: z
    .string()
    .min(10)
    .max(15),

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