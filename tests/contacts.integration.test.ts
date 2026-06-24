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
  "Contacts API",
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
      "should list contacts for tenant",
      async () => {

        const tenant =
          await createTestTenant();

        await prisma.contact.createMany({
          data: [
            {
              tenantId: tenant.id,
              phoneNumber: "9000000001",
              name: "Ramesh",
              tags: ["pricing inquiry"],
              callCount: 2
            },
            {
              tenantId: tenant.id,
              phoneNumber: "9000000002",
              name: "Priya",
              tags: ["site visit"],
              callCount: 1
            }
          ]
        });

        const response =
          await request(app)
            .get("/api/contacts")
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.items.length).toBe(2);
      }
    );

    it(
      "should filter contacts by tag",
      async () => {

        const tenant =
          await createTestTenant();

        await prisma.contact.createMany({
          data: [
            {
              tenantId: tenant.id,
              phoneNumber: "9000000011",
              name: "A",
              tags: ["pricing inquiry"],
              callCount: 1
            },
            {
              tenantId: tenant.id,
              phoneNumber: "9000000012",
              name: "B",
              tags: ["site visit"],
              callCount: 1
            }
          ]
        });

        const response =
          await request(app)
            .get("/api/contacts?tag=pricing inquiry")
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.data.items.length).toBe(1);
        expect(response.body.data.items[0].phoneNumber)
          .toBe("9000000011");
      }
    );

    it(
      "should get contact detail with last 5 call records",
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
              phoneNumber: "9888888888",
              name: "Rahul",
              tags: [],
              callCount: 6
            }
          });

        for (let i = 0; i < 6; i++) {
          await prisma.callRecord.create({
            data: {
              tenantId: tenant.id,
              virtualNumberId: virtualNumber.id,
              contactId: contact.id,
              callerMobile: "9888888888",
              direction: "INBOUND",
              status: "ANSWERED",
              durationSec: 10 + i
            }
          });
        }

        const response =
          await request(app)
            .get(`/api/contacts/${contact.id}`)
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.callRecords.length)
          .toBe(5);
      }
    );

    it(
      "should return contact timeline",
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
              phoneNumber: "9777777777",
              name: "Deepa",
              tags: [],
              callCount: 2
            }
          });

        await prisma.callRecord.createMany({
          data: [
            {
              tenantId: tenant.id,
              virtualNumberId: virtualNumber.id,
              contactId: contact.id,
              callerMobile: "9777777777",
              direction: "INBOUND",
              status: "ANSWERED",
              durationSec: 12
            },
            {
              tenantId: tenant.id,
              virtualNumberId: virtualNumber.id,
              contactId: contact.id,
              callerMobile: "9777777777",
              direction: "OUTBOUND",
              status: "MISSED",
              durationSec: 0
            }
          ]
        });

        const response =
          await request(app)
            .get(`/api/contacts/${contact.id}/timeline`)
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBe(2);
      }
    );

    it(
      "should update contact name and tags",
      async () => {

        const tenant =
          await createTestTenant();

        const contact =
          await prisma.contact.create({
            data: {
              tenantId: tenant.id,
              phoneNumber: "9666666666",
              name: "Old Name",
              tags: ["old-tag"],
              callCount: 1
            }
          });

        const response =
          await request(app)
            .patch(`/api/contacts/${contact.id}`)
            .set(
              createAuthHeader(
                tenant.id
              )
            )
            .send({
              name: "New Name",
              addTags: ["priority", "pricing inquiry"],
              removeTags: ["old-tag"]
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const updated =
          await prisma.contact.findUnique({
            where: {
              id: contact.id
            }
          });

        expect(updated?.name).toBe("New Name");
        expect(updated?.tags).toContain("priority");
        expect(updated?.tags).toContain("pricing inquiry");
        expect(updated?.tags).not.toContain("old-tag");
      }
    );

    it(
      "should soft delete contact",
      async () => {

        const tenant =
          await createTestTenant();

        const contact =
          await prisma.contact.create({
            data: {
              tenantId: tenant.id,
              phoneNumber: "9555555555",
              name: "Delete Me",
              tags: [],
              callCount: 1
            }
          });

        const response =
          await request(app)
            .delete(`/api/contacts/${contact.id}`)
            .set(
              createAuthHeader(
                tenant.id
              )
            );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const deleted =
          await prisma.contact.findUnique({
            where: {
              id: contact.id
            }
          });

        expect(deleted?.isDeleted).toBe(true);
        expect(deleted?.deletedAt).toBeTruthy();
      }
    );

    it(
      "should not allow cross-tenant contact access",
      async () => {

        const tenantA =
          await createTestTenant();

        const tenantB =
          await createTestTenant();

        const contact =
          await prisma.contact.create({
            data: {
              tenantId: tenantA.id,
              phoneNumber: "9444444444",
              name: "Tenant A Contact",
              tags: [],
              callCount: 1
            }
          });

        const response =
          await request(app)
            .get(`/api/contacts/${contact.id}`)
            .set(
              createAuthHeader(
                tenantB.id
              )
            );

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    );
  }
);