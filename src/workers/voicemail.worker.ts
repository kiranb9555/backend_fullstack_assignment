import { Worker, Job } from "bullmq";

import { JobStatus } from "@prisma/client";

import { queueConnection } from "../queues/connection.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../logger/logger.js";
import { getIO } from "../socket/socket.js";

import { TranscriptService } from "../services/transcript.service.js";
import { AiExtractionService } from "../services/ai-extraction.service.js";
import { ContactIntelligenceService } from "../services/contact-intelligence.service.js";

interface VoicemailJobPayload {
  tenantId: string;
  callRecordId: string;
  intelligenceJobId: string;
}

const transcriptService =
  new TranscriptService();

const aiExtractionService =
  new AiExtractionService();

const contactIntelligenceService =
  new ContactIntelligenceService();

export const voicemailWorker =
  new Worker<VoicemailJobPayload>(
    "voicemail-processing",
    async (
      job: Job<VoicemailJobPayload>
    ) => {

      const startedAt = Date.now();

      const {
        tenantId,
        callRecordId,
        intelligenceJobId
      } = job.data;

      const callRecord =
        await prisma.callRecord.findFirst({
          where: {
            id: callRecordId,
            tenantId
          }
        });

      if (!callRecord) {
        throw new Error(
          "CallRecord not found for voicemail job"
        );
      }

      const transcript =
        transcriptService.generateTranscript();

      /**
       * Save transcript immediately after generation
       * so we never lose raw data even if AI fails.
       */
      await prisma.intelligenceJob.update({
        where: {
          id: intelligenceJobId
        },
        data: {
          status: JobStatus.PROCESSING,
          transcript
        }
      });

      try {

        const extracted =
          await aiExtractionService.extractFromTranscript(
            transcript
          );

        const summary =
          extracted.intent
            ? `${extracted.intent} | ${extracted.sentiment}`
            : `Voicemail processed | ${extracted.sentiment}`;

        const result =
          await prisma.$transaction(async tx => {

            const contact =
              await contactIntelligenceService
                .upsertContactFromIntelligence(
                  tx,
                  tenantId,
                  callRecord.callerMobile,
                  extracted
                );

            const updatedCallRecord =
              await tx.callRecord.update({
                where: {
                  id: callRecordId
                },
                data: {
                  contactId: contact.id,
                  aiSummary: summary
                }
              });

            await tx.intelligenceJob.update({
              where: {
                id: intelligenceJobId
              },
              data: {
                status: JobStatus.DONE,
                extractedData: extracted,
                processingMs:
                  Date.now() - startedAt,
                errorMessage: null
              }
            });

            return updatedCallRecord;
          });

        getIO()
          .to(`tenant:${tenantId}`)
          .emit(
            "intelligence_ready",
            result
          );

        logger.info({
          event: "voicemail_processed",
          tenantId,
          callRecordId,
          intelligenceJobId
        });

        return;
      } catch (error) {

        const err =
          error instanceof Error
            ? error
            : new Error("Unknown worker error");

        await prisma.intelligenceJob.update({
          where: {
            id: intelligenceJobId
          },
          data: {
            status: JobStatus.FAILED,
            processingMs:
              Date.now() - startedAt,
            errorMessage: err.message,
            retryCount: {
              increment: 1
            }
          }
        });

        logger.error({
          event: "voicemail_processing_failed",
          tenantId,
          callRecordId,
          intelligenceJobId,
          message: err.message
        });

        throw err;
      }
    },
    {
      connection: queueConnection,
      concurrency: 5
    }
  );

voicemailWorker.on(
  "failed",
  (job, error) => {
    logger.error({
      event: "voicemail_worker_job_failed",
      jobId: job?.id,
      message: error.message
    });
  }
);

voicemailWorker.on(
  "completed",
  job => {
    logger.info({
      event: "voicemail_worker_job_completed",
      jobId: job.id
    });
  }
);