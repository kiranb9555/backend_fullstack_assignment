import { prisma } from "../../db/prisma.js";
import { redis } from "../../redis/redis.js";

import { logger } from "../../logger/logger.js";

import { OtpService } from "./otp.service.js";
import { TokenService } from "./token.service.js";

import { BadRequestError } from "../../common/errors/BadRequestError.js";

export class AuthService {

  private readonly otpService =
    new OtpService();

  private readonly tokenService =
    new TokenService();

  async sendOtp(
    mobile: string
  ) {

    const rateKey =
      `otp-limit:${mobile}`;

    const count =
      await redis.incr(rateKey);

    if (count === 1) {
      await redis.expire(
        rateKey,
        600
      );
    }

    if (count > 3) {
      throw new BadRequestError(
        "Maximum OTP requests exceeded"
      );
    }

    const otp =
      await this.otpService.generateOtp(
        mobile
      );

    logger.info({
      event: "otp_generated",
      mobile,
      otp
    });

    return {
      success: true
    };
  }

  async verifyOtp(
    mobile: string,
    otp: string
  ) {

    const storedOtp =
      await this.otpService.getOtp(
        mobile
      );

    if (!storedOtp) {
      throw new BadRequestError(
        "OTP expired"
      );
    }

    if (storedOtp !== otp) {
      throw new BadRequestError(
        "Invalid OTP"
      );
    }

    await this.otpService.deleteOtp(
      mobile
    );

    let tenant =
      await prisma.tenant.findUnique({
        where: {
          mobile
        }
      });

    if (!tenant) {

      tenant =
        await prisma.tenant.create({
          data: {
            mobile,
            businessName: mobile
          }
        });
    }

    const tokens =
      await this.tokenService.createTokens(
        tenant.id
      );

    return {
      tenant,
      accessToken:
        tokens.accessToken,
      refreshToken:
        tokens.refreshToken
    };
  }

  async refresh(
    refreshToken: string
  ) {

    return this.tokenService
      .rotateRefreshToken(
        refreshToken
      );
  }

  async logout(
    refreshToken: string
  ) {

    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken
      }
    });

    return {
      success: true
    };
  }
}