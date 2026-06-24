import { Request, Response } from "express";

import { NumbersService } from "./numbers.service.js";

import { BadRequestError } from "../../common/errors/BadRequestError.js";

export class NumbersController {

  private readonly service =
    new NumbersService();

  getNumbers = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const page =
      Number(req.query.page ?? 1);

    const limit =
      Number(req.query.limit ?? 20);

    const result =
      await this.service.getNumbers(
        req.tenant!.id,
        page,
        limit
      );

    res.json({
      success: true,
      data: result
    });
  };

  getNumberById = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const numberId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!numberId) {
      throw new BadRequestError(
        "Number id required"
      );
    }

    const result =
      await this.service.getNumberById(
        req.tenant!.id,
        numberId
      );

    res.json({
      success: true,
      data: result
    });
  };

  createNumber = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const result =
      await this.service.provisionNumber(
        req.tenant!.id,
        req.body
      );

    res.status(201).json({
      success: true,
      data: result
    });
  };

  updateNumber = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const numberId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    if (!numberId) {
      throw new BadRequestError(
        "Number id required"
      );
    }

    const result =
      await this.service.updateNumber(
        req.tenant!.id,
        numberId,
        req.body
      );

    res.json({
      success: true,
      data: result
    });
  };
}