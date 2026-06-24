import { startVoicemailWorker } from "./voicemail.worker.js";
import { startContactCleanupWorker } from "./contact-cleanup.worker.js";

startVoicemailWorker();
startContactCleanupWorker();