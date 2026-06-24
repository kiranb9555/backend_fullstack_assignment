import {
  CallDirection,
  CallStatus,
  JobStatus
} from "@prisma/client";

import { prisma } from "../../db/prisma.js";
import { getIO } from "../../socket/socket.js";
import { voicemailQueue } from "../../queues/voicemail.queue.js";

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

    /**
     * Ensure contact exists and callCount is incremented
     * for every simulated call, regardless of voicemail.
     */
    let contact =
      await prisma.contact.findFirst({
        where: {
          tenantId,
          phoneNumber: dto.callerMobile,
          isDeleted: false
        }
      });

    if (!contact) {
      contact =
        await prisma.contact.create({
          data: {
            tenantId,
            phoneNumber: dto.callerMobile,
            tags: [],
            callCount: 1
          }
        });
    } else {
      contact =
        await prisma.contact.update({
          where: {
            id: contact.id
          },
          data: {
            callCount: {
              increment: 1
            }
          }
        });
    }

    const callRecord =
      await prisma.callRecord.create({
        data: {
          tenantId,
          virtualNumberId: dto.virtualNumberId,
          contactId: contact.id,
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
          attempts: 2,
          removeOnComplete: false,
          removeOnFail: false
        }
      );
    }

    getIO()
      .to(`tenant:${tenantId}`)
      .emit(
        "call_event",
        {
          event: "call_event",
          data: callRecord
        }
      );

    return callRecord;
  }
}