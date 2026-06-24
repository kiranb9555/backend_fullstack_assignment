import { Queue } from "bullmq";

import { queueConnection } from "./connection.js";

export const contactCleanupQueue =
  new Queue(
    "contact-cleanup",
    {
      connection: queueConnection
    }
  );