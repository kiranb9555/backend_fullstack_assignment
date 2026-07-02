import {
  CallDirection,
  CallStatus,
  JobStatus
} from "@prisma/client";

import { prisma } from "../../db/prisma.js";
import { emitToTenantRoom } from "../../socket/socket.js";
import { voicemailQueue } from "../../queues/voicemail.queue.js";
import { logger } from "../../logger/logger.js";

import { BadRequestError } from "../../common/errors/BadRequestError.js";

import { SimulateCallDto } from "./dto/simulateCall.dto.js";

export class SimulateService {

  async simulateCall(
    tenantId: string,
    dto: SimulateCallDto
  ) {

    const virtualNumber =
      await prisma.virtualNumber.findFirst({
        where: {
          id: dto.virtualNumberId,
          tenantId
        }
      });

    if (!virtualNumber) {
      throw new BadRequestError(
        "Virtual number not found"
      );
    }

    const callRecord =
      await prisma.callRecord.create({
        data: {
          tenantId,
          virtualNumberId: dto.virtualNumberId,
          callerMobile: dto.callerMobile,
          direction: dto.direction as CallDirection,
          durationSec: dto.durationSec,
          status:
            dto.durationSec === 0
              ? CallStatus.MISSED
              : CallStatus.ANSWERED
        }
      });

    if (dto.hasVoicemail) {

      const intelligenceJob =
        await prisma.intelligenceJob.create({
          data: {
            tenantId,
            callRecordId: callRecord.id,
            status: JobStatus.PENDING
          }
        });

      await voicemailQueue.add(
        "process-voicemail",
        {
          tenantId,
          callRecordId: callRecord.id,
          intelligenceJobId: intelligenceJob.id
        },
        {
          attempts: 3,
          removeOnComplete: false,
          removeOnFail: false
        }
      );
    }

    const socketPayload = {
      event: "call_event",
      data: callRecord
    };

    const recipientCount =
      await emitToTenantRoom(
      tenantId,
      "call_event",
      socketPayload
    );

    logger.info({
      event: "simulate_call_emitted",
      tenantId,
      callRecordId: callRecord.id,
      socketEvent: "call_event",
      recipientCount
    });

    return callRecord;
  }
}
