import { prisma } from "../db/prisma.js";

export class ContactCleanupService {

  async cleanupDeletedContacts() {
    const cutoff =
      new Date(
        Date.now() -
        30 * 24 * 60 * 60 * 1000
      );

    const result =
      await prisma.contact.deleteMany({
        where: {
          isDeleted: true,
          deletedAt: {
            lte: cutoff
          }
        }
      });

    return result;
  }
}