import { Worker, Job } from "bullmq";

import { queueConnection } from "../queues/connection.js";
import { logger } from "../logger/logger.js";

import { ContactCleanupService } from "../services/contact-cleanup.service.js";

const cleanupService =
  new ContactCleanupService();

let workerInstance:
  Worker | null = null;

export const startContactCleanupWorker = () => {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance =
    new Worker(
      "contact-cleanup",
      async (_job: Job) => {
        const result =
          await cleanupService.cleanupDeletedContacts();

        logger.info({
          event: "contact_cleanup_completed",
          deletedCount: result.count
        });
      },
      {
        connection: queueConnection
      }
    );

  workerInstance.on(
    "completed",
    job => {
      logger.info({
        event: "contact_cleanup_worker_completed",
        jobId: job.id
      });
    }
  );

  workerInstance.on(
    "failed",
    (job, error) => {
      logger.error({
        event: "contact_cleanup_worker_failed",
        jobId: job?.id,
        message: error.message
      });
    }
  );

  return workerInstance;
};

export const stopContactCleanupWorker = async () => {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
};