import { Queue } from "bullmq";

import { queueConnection } from "./connection.js";

export const voicemailQueue =
  new Queue(
    "voicemail-processing",
    {
      connection:
        queueConnection
    }
  );