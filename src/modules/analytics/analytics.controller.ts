import { Request, Response } from "express";

import { AnalyticsService } from "./analytics.service.js";

export class AnalyticsController {

  private readonly service =
    new AnalyticsService();

  getSummary = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.getSummary(
        req.tenant!.id
      );

    res.json({
      success: true,
      data: result
    });
  };
}