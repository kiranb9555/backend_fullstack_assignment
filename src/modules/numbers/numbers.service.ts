import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma.js";

import { logger } from "../../logger/logger.js";

import { BadRequestError } from "../../common/errors/BadRequestError.js";

import { CreateNumberDto } from "./dto/createNumber.dto.js";
import { UpdateNumberDto } from "./dto/updateNumber.dto.js";

export class NumbersService {

  async getNumbers(
    tenantId: string,
    page = 1,
    limit = 20
  ) {

    const skip =
      (page - 1) * limit;

    const [items, total] =
      await Promise.all([
        prisma.virtualNumber.findMany({
          where: {
            tenantId
          },
          orderBy: {
            provisionedAt: "desc"
          },
          skip,
          take: limit
        }),

        prisma.virtualNumber.count({
          where: {
            tenantId
          }
        })
      ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages:
        Math.ceil(total / limit)
    };
  }

  async getNumberById(
    tenantId: string,
    numberId: string
  ) {

    const number =
      await prisma.virtualNumber.findFirst({
        where: {
          id: numberId,
          tenantId
        }
      });

    if (!number) {
      throw new BadRequestError(
        "Virtual number not found"
      );
    }

    return number;
  }

  async provisionNumber(
    tenantId: string,
    dto: CreateNumberDto
  ) {

    const availableCount =
      await prisma.numberPool.count({
        where: {
          isAssigned: false
        }
      });

    if (availableCount < 5) {

      logger.warn({
        event:
          "number_pool_low_inventory",
        availableNumbers:
          availableCount
      });
    }

    return prisma.$transaction(
      async (
        tx: Prisma.TransactionClient
      ) => {

        const poolNumber =
          await tx.numberPool.findFirst({
            where: {
              isAssigned: false
            },
            orderBy: {
              createdAt: "asc"
            }
          });

        if (!poolNumber) {
          throw new BadRequestError(
            "No numbers available"
          );
        }

        await tx.numberPool.update({
          where: {
            id: poolNumber.id
          },
          data: {
            isAssigned: true,
            assignedAt: new Date()
          }
        });

        return tx.virtualNumber.create({
          data: {
            tenantId,
            numberPoolId:
              poolNumber.id,
            e164Number:
              poolNumber.e164Number,
            label:
              dto.label
          }
        });
      }
    );
  }

  async updateNumber(
    tenantId: string,
    numberId: string,
    dto: UpdateNumberDto
  ) {

    const existing =
      await prisma.virtualNumber.findFirst({
        where: {
          id: numberId,
          tenantId
        }
      });

    if (!existing) {
      throw new BadRequestError(
        "Virtual number not found"
      );
    }

    return prisma.virtualNumber.update({
      where: {
        id: numberId
      },
      data: {
        label:
          dto.label,
        isActive:
          dto.isActive
      }
    });
  }
}