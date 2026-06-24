import { startVoicemailWorker } from "./voicemail.worker.js";
import { startContactCleanupWorker } from "./contact-cleanup.worker.js";

export const startWorkers = () => {
  startVoicemailWorker();
  startContactCleanupWorker();
};