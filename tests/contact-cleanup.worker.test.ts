import { prisma } from "../src/db/prisma.js";

import {
  cleanupDatabase,
  cleanupQueues,
  createTestTenant
} from "../src/test/testUtils.js";

import { ContactCleanupService } from "../src/services/contact-cleanup.service.js";

describe(
  "Contact cleanup service",
  () => {

    const service =
      new ContactCleanupService();

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
      "should permanently delete contacts soft deleted more than 30 days ago",
      async () => {

        const tenant =
          await createTestTenant();

        const oldDate =
          new Date(
            Date.now() -
            31 * 24 * 60 * 60 * 1000
          );

        await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            phoneNumber: "9333333333",
            name: "Old Deleted Contact",
            tags: [],
            callCount: 1,
            isDeleted: true,
            deletedAt: oldDate
          }
        });

        await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            phoneNumber: "9222222222",
            name: "Recent Deleted Contact",
            tags: [],
            callCount: 1,
            isDeleted: true,
            deletedAt: new Date()
          }
        });

        const result =
          await service.cleanupDeletedContacts();

        expect(result.count).toBe(1);

        const remaining =
          await prisma.contact.findMany({
            where: {
              tenantId: tenant.id
            }
          });

        expect(remaining.length).toBe(1);
        expect(remaining[0].phoneNumber)
          .toBe("9222222222");
      }
    );
  }
);