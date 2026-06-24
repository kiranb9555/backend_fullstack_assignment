import { contactCleanupQueue } from "../queues/contact-cleanup.queue.js";

export const scheduleContactCleanup = async () => {
  await contactCleanupQueue.add(
    "cleanup-deleted-contacts",
    {},
    {
      jobId: "daily-contact-cleanup",
      repeat: {
        every: 24 * 60 * 60 * 1000
      },
      removeOnComplete: false,
      removeOnFail: false
    }
  );
};