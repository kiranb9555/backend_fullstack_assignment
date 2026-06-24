import { redis } from "./redis.service";

const OTP_TTL = 300;

export async function generateOtp(
  mobile: string
): Promise<string> {

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  await redis.set(
    `otp:${mobile}`,
    otp,
    "EX",
    OTP_TTL
  );

  return otp;
}

export async function getOtp(
  mobile: string
): Promise<string | null> {

  return redis.get(`otp:${mobile}`);
}

export async function deleteOtp(
  mobile: string
) {
  await redis.del(`otp:${mobile}`);
}