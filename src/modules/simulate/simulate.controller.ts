import { Request, Response } from "express";

import { SimulateService } from "./simulate.service.js";

export class SimulateController {

  private readonly service =
    new SimulateService();

  createCall = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.simulateCall(
        req.tenant!.id,
        req.body
      );

    res.status(201).json({
      success: true,
      data: result
    });
  };
}