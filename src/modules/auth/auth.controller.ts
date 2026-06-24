import { Request } from "express";
import { Response } from "express";

import { AuthService } from "./auth.service.js";

export class AuthController {

  private readonly service =
    new AuthService();

  sendOtp = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.sendOtp(
        req.body.mobile
      );

    res.json(result);
  };

  verifyOtp = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.verifyOtp(
        req.body.mobile,
        req.body.otp
      );

    res.json(result);
  };

  refresh = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.refresh(
        req.body.refreshToken
      );

    res.json(result);
  };

  logout = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.logout(
        req.body.refreshToken
      );

    res.json(result);
  };
}