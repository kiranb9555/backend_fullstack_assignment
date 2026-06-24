import { redis } from "../../redis/redis.js";

const OTP_TTL_SECONDS = 300;

export class OtpService {

  async generateOtp(
    mobile: string
  ): Promise<string> {

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await redis.set(
      `otp:${mobile}`,
      otp,
      "EX",
      OTP_TTL_SECONDS
    );

    return otp;
  }

  async getOtp(
    mobile: string
  ): Promise<string | null> {

    return redis.get(
      `otp:${mobile}`
    );
  }

  async deleteOtp(
    mobile: string
  ): Promise<void> {

    await redis.del(
      `otp:${mobile}`
    );
  }
}