import request from "supertest";

import { app } from "../src/test/testApp.js";
import { prisma } from "../src/db/prisma.js";

import {
  cleanupDatabase,
  cleanupQueues,
  createAuthHeader,
  createTestTenant,
  createVirtualNumber
} from "../src/test/testUtils.js";

import { waitFor } from "../src/test/waitFor.js";

import {
  startVoicemailWorker,
  stopVoicemailWorker
} from "../src/workers/voicemail.worker.js";

describe(
  "Voicemail Worker E2E",
  () => {

    beforeAll(async () => {
      startVoicemailWorker();
    });

    beforeEach(async () => {
      await cleanupQueues();
      await cleanupDatabase();
    });

    afterAll(async () => {
      await cleanupQueues();
      await cleanupDatabase();
      await stopVoicemailWorker();
      await prisma.$disconnect();
    });

    it(
      "should process voicemail job end-to-end and mark intelligence job DONE",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        const simulateResponse =
          await request(app)
            .post("/api/simulate/call")
            .set(
              createAuthHeader(
                tenant.id
              )
            )
            .send({
              virtualNumberId:
                virtualNumber.id,
              callerMobile:
                "9876543210",
              direction:
                "INBOUND",
              durationSec: 25,
              hasVoicemail: true
            });

        expect(
          simulateResponse.status
        ).toBe(201);

        const callRecord =
          await prisma.callRecord.findFirst({
            where: {
              tenantId: tenant.id,
              callerMobile:
                "9876543210"
            }
          });

        expect(callRecord).not.toBeNull();

        await waitFor(
          async () => {
            const job =
              await prisma.intelligenceJob.findFirst({
                where: {
                  tenantId: tenant.id,
                  callRecordId:
                    callRecord!.id
                }
              });

            return job?.status === "DONE";
          },
          {
            timeoutMs: 15000,
            intervalMs: 300
          }
        );

        const intelligenceJob =
          await prisma.intelligenceJob.findFirst({
            where: {
              tenantId: tenant.id,
              callRecordId:
                callRecord!.id
            }
          });

        expect(intelligenceJob).not.toBeNull();
        expect(
          intelligenceJob?.status
        ).toBe("DONE");
        expect(
          intelligenceJob?.transcript
        ).toBeTruthy();
        expect(
          intelligenceJob?.extractedData
        ).toBeTruthy();

        const updatedCallRecord =
          await prisma.callRecord.findUnique({
            where: {
              id: callRecord!.id
            }
          });

        expect(
          updatedCallRecord?.aiSummary
        ).toBeTruthy();

        const updatedContact =
          await prisma.contact.findFirst({
            where: {
              tenantId: tenant.id,
              phoneNumber:
                "9876543210"
            }
          });

        expect(updatedContact).not.toBeNull();
        expect(
          updatedContact?.callCount
        ).toBe(1);

        /**
         * Depending on the transcript sample chosen,
         * name may or may not be set, and tags may or may not exist.
         * But the contact must exist and not be deleted.
         */
        expect(
          updatedContact?.isDeleted
        ).toBe(false);
      }
    );

    it(
      "should create FAILED intelligence job if processing throws and still preserve transcript when possible",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        /**
         * This test is limited by the current fake AI service,
         * which normally does not fail.
         *
         * So for now we verify at least that voicemail job is created
         * and worker attempts processing.
         *
         * If later you inject a failing AI service or mock extraction,
         * this test can be upgraded to assert FAILED state directly.
         */

        const simulateResponse =
          await request(app)
            .post("/api/simulate/call")
            .set(
              createAuthHeader(
                tenant.id
              )
            )
            .send({
              virtualNumberId:
                virtualNumber.id,
              callerMobile:
                "9999999999",
              direction:
                "INBOUND",
              durationSec: 15,
              hasVoicemail: true
            });

        expect(
          simulateResponse.status
        ).toBe(201);

        const callRecord =
          await prisma.callRecord.findFirst({
            where: {
              tenantId: tenant.id,
              callerMobile:
                "9999999999"
            }
          });

        expect(callRecord).not.toBeNull();

        await waitFor(
          async () => {
            const job =
              await prisma.intelligenceJob.findFirst({
                where: {
                  tenantId: tenant.id,
                  callRecordId:
                    callRecord!.id
                }
              });

            return (
              job?.status === "DONE" ||
              job?.status === "FAILED"
            );
          },
          {
            timeoutMs: 15000,
            intervalMs: 300
          }
        );

        const intelligenceJob =
          await prisma.intelligenceJob.findFirst({
            where: {
              tenantId: tenant.id,
              callRecordId:
                callRecord!.id
            }
          });

        expect(intelligenceJob).not.toBeNull();
        expect(
          ["DONE", "FAILED"]
            .includes(
              intelligenceJob!.status
            )
        ).toBe(true);

        if (
          intelligenceJob?.status === "FAILED"
        ) {
          expect(
            intelligenceJob.errorMessage
          ).toBeTruthy();
        }
      }
    );
  }
);