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

describe(
  "Analytics API",
  () => {

    beforeEach(async () => {
      await cleanupQueues();
      await cleanupDatabase();
    });

    afterAll(async () => {
      await cleanupQueues();
      await cleanupDatabase();
      await prisma.$disconnect();
    });

    it(
      "should return analytics summary for tenant",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        const contactA =
          await prisma.contact.create({
            data: {
              tenantId: tenant.id,
              phoneNumber: "9000000001",
              name: "Priya",
              tags: ["pricing inquiry"],
              callCount: 5,
              firstSeenAt: new Date()
            }
          });

        const contactB =
          await prisma.contact.create({
            data: {
              tenantId: tenant.id,
              phoneNumber: "9000000002",
              name: "Rahul",
              tags: ["site visit"],
              callCount: 2,
              firstSeenAt: new Date()
            }
          });

        const callA1 =
          await prisma.callRecord.create({
            data: {
              tenantId: tenant.id,
              virtualNumberId:
                virtualNumber.id,
              contactId:
                contactA.id,
              callerMobile:
                "9000000001",
              direction:
                "INBOUND",
              status:
                "ANSWERED",
              durationSec: 40,
              createdAt: new Date()
            }
          });

        const callA2 =
          await prisma.callRecord.create({
            data: {
              tenantId: tenant.id,
              virtualNumberId:
                virtualNumber.id,
              contactId:
                contactA.id,
              callerMobile:
                "9000000001",
              direction:
                "OUTBOUND",
              status:
                "MISSED",
              durationSec: 0,
              createdAt: new Date()
            }
          });

        const callB1 =
          await prisma.callRecord.create({
            data: {
              tenantId: tenant.id,
              virtualNumberId:
                virtualNumber.id,
              contactId:
                contactB.id,
              callerMobile:
                "9000000002",
              direction:
                "INBOUND",
              status:
                "ANSWERED",
              durationSec: 25,
              createdAt: new Date()
            }
          });

        await prisma.intelligenceJob.createMany({
          data: [
            {
              tenantId: tenant.id,
              callRecordId: callA1.id,
              status: "DONE",
              transcript:
                "Pricing call from Priya",
              extractedData: {
                name: "Priya",
                intent: "pricing inquiry",
                sentiment: "positive",
                callbackRequested: true
              },
              processingMs: 100
            },
            {
              tenantId: tenant.id,
              callRecordId: callA2.id,
              status: "DONE",
              transcript:
                "Missed callback from Priya",
              extractedData: {
                name: "Priya",
                intent: "callback request",
                sentiment: "negative",
                callbackRequested: true
              },
              processingMs: 120
            },
            {
              tenantId: tenant.id,
              callRecordId: callB1.id,
              status: "DONE",
              transcript:
                "Site visit request from Rahul",
              extractedData: {
                name: "Rahul",
                intent: "site visit request",
                sentiment: "neutral",
                callbackRequested: false
              },
              processingMs: 90
            }
          ]
        });

        const response =
          await request(app)
            .get("/api/analytics/summary")
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const data =
          response.body.data;

        expect(data.totalCallsToday)
          .toBe(3);

        expect(data.missedCallsToday)
          .toBe(1);

        expect(data.newContactsThisWeek)
          .toBe(2);

        expect(data.topCallers.length)
          .toBe(2);

        expect(data.topCallers[0].id)
          .toBe(contactA.id);

        expect(data.topCallers[0].callCount)
          .toBe(5);

        expect(
          data.sentimentBreakdown
        ).toEqual({
          positive: 1,
          neutral: 1,
          negative: 1
        });
      }
    );

    it(
      "should ignore other tenants data",
      async () => {

        const tenantA =
          await createTestTenant();

        const tenantB =
          await createTestTenant();

        const virtualA =
          await createVirtualNumber(
            tenantA.id
          );

        const virtualB =
          await createVirtualNumber(
            tenantB.id
          );

        const contactA =
          await prisma.contact.create({
            data: {
              tenantId: tenantA.id,
              phoneNumber: "9111111111",
              name: "Tenant A Contact",
              tags: [],
              callCount: 3,
              firstSeenAt: new Date()
            }
          });

        const contactB =
          await prisma.contact.create({
            data: {
              tenantId: tenantB.id,
              phoneNumber: "9222222222",
              name: "Tenant B Contact",
              tags: [],
              callCount: 9,
              firstSeenAt: new Date()
            }
          });

        const callA =
          await prisma.callRecord.create({
            data: {
              tenantId: tenantA.id,
              virtualNumberId:
                virtualA.id,
              contactId:
                contactA.id,
              callerMobile:
                "9111111111",
              direction:
                "INBOUND",
              status:
                "ANSWERED",
              durationSec: 20,
              createdAt: new Date()
            }
          });

        await prisma.callRecord.create({
          data: {
            tenantId: tenantB.id,
            virtualNumberId:
              virtualB.id,
            contactId:
              contactB.id,
            callerMobile:
              "9222222222",
            direction:
              "INBOUND",
            status:
              "MISSED",
            durationSec: 0,
            createdAt: new Date()
          }
        });

        await prisma.intelligenceJob.create({
          data: {
            tenantId: tenantA.id,
            callRecordId: callA.id,
            status: "DONE",
            transcript:
              "Hello from tenant A",
            extractedData: {
              name: "A",
              intent: "pricing inquiry",
              sentiment: "positive",
              callbackRequested: true
            },
            processingMs: 80
          }
        });

        const response =
          await request(app)
            .get("/api/analytics/summary")
            .set(
              createAuthHeader(
                tenantA.id
              )
            );

        expect(response.status).toBe(200);

        const data =
          response.body.data;

        expect(data.totalCallsToday)
          .toBe(1);

        expect(data.missedCallsToday)
          .toBe(0);

        expect(data.newContactsThisWeek)
          .toBe(1);

        expect(data.topCallers.length)
          .toBe(1);

        expect(data.topCallers[0].id)
          .toBe(contactA.id);

        expect(
          data.sentimentBreakdown
        ).toEqual({
          positive: 1,
          neutral: 0,
          negative: 0
        });
      }
    );

    it(
      "should return zeroed sentiment breakdown when no intelligence jobs exist",
      async () => {

        const tenant =
          await createTestTenant();

        const virtualNumber =
          await createVirtualNumber(
            tenant.id
          );

        const contact =
          await prisma.contact.create({
            data: {
              tenantId: tenant.id,
              phoneNumber: "9333333333",
              name: "No Intelligence Contact",
              tags: [],
              callCount: 1,
              firstSeenAt: new Date()
            }
          });

        await prisma.callRecord.create({
          data: {
            tenantId: tenant.id,
            virtualNumberId:
              virtualNumber.id,
            contactId:
              contact.id,
            callerMobile:
              "9333333333",
            direction:
              "INBOUND",
            status:
              "ANSWERED",
            durationSec: 15,
            createdAt: new Date()
          }
        });

        const response =
          await request(app)
            .get("/api/analytics/summary")
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);

        expect(
          response.body.data.sentimentBreakdown
        ).toEqual({
          positive: 0,
          neutral: 0,
          negative: 0
        });
      }
    );

    it(
      "should count only contacts created within the last 7 days",
      async () => {

        const tenant =
          await createTestTenant();

        await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            phoneNumber: "9444444441",
            name: "Recent Contact",
            tags: [],
            callCount: 1,
            firstSeenAt: new Date()
          }
        });

        await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            phoneNumber: "9444444442",
            name: "Old Contact",
            tags: [],
            callCount: 1,
            firstSeenAt: new Date(
              Date.now() -
              10 * 24 * 60 * 60 * 1000
            )
          }
        });

        const response =
          await request(app)
            .get("/api/analytics/summary")
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(
          response.body.data.newContactsThisWeek
        ).toBe(1);
      }
    );
  }
);