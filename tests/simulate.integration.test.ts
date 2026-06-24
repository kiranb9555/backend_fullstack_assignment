import request from "supertest";

import { app } from "../src/test/testApp.js";
import { prisma } from "../src/db/prisma.js";

import {
  cleanupDatabase,
  createAuthHeader,
  createTestTenant,
  createVirtualNumber
} from "../src/test/testUtils.js";

describe(
  "Simulate Call API",
  () => {

    beforeEach(async () => {
      await cleanupDatabase();
    });

    afterAll(async () => {
      await cleanupDatabase();
      await prisma.$disconnect();
    });

    it(
      "should create a call record and contact for a normal call",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        const response =
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
              durationSec: 45,
              hasVoicemail: false
            });

        expect(
          response.status
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        const contact =
          await prisma.contact.findFirst({
            where: {
              tenantId: tenant.id,
              phoneNumber:
                "9876543210"
            }
          });

        expect(contact).not.toBeNull();
        expect(contact?.callCount)
          .toBe(1);

        const callRecord =
          await prisma.callRecord.findFirst({
            where: {
              tenantId: tenant.id,
              callerMobile:
                "9876543210"
            }
          });

        expect(callRecord).not.toBeNull();
        expect(callRecord?.status)
          .toBe("ANSWERED");
      }
    );

    it(
      "should create an intelligence job when voicemail is true",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        const response =
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
              durationSec: 10,
              hasVoicemail: true
            });

        expect(
          response.status
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

        const job =
          await prisma.intelligenceJob.findFirst({
            where: {
              tenantId: tenant.id,
              callRecordId:
                callRecord!.id
            }
          });

        expect(job).not.toBeNull();
        expect(job?.status)
          .toBe("PENDING");
      }
    );

    it(
      "should return 400 when virtual number does not belong to tenant",
      async () => {

        const tenantA =
          await createTestTenant();

        const tenantB =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenantA.id
          );

        const response =
          await request(app)
            .post("/api/simulate/call")
            .set(
              createAuthHeader(
                tenantB.id
              )
            )
            .send({
              virtualNumberId:
                virtualNumber.id,
              callerMobile:
                "9000000000",
              direction:
                "INBOUND",
              durationSec: 20,
              hasVoicemail: false
            });

        expect(
          response.status
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);
      }
    );
  }
);