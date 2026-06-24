import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma.js";
import { BadRequestError } from "../../common/errors/BadRequestError.js";

import { GetContactsDto } from "./dto/getContacts.dto.js";
import { UpdateContactDto } from "./dto/updateContact.dto.js";

export class ContactsService {

  async getContacts(
    tenantId: string,
    dto: GetContactsDto
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      tenantId,
      isDeleted: false
    };

    if (dto.tag) {
      where.tags = {
        has: dto.tag
      };
    }

    if (dto.minCallCount !== undefined) {
      where.callCount = {
        gte: dto.minCallCount
      };
    }

    if (dto.firstSeenFrom || dto.firstSeenTo) {
      where.firstSeenAt = {};
      if (dto.firstSeenFrom) {
        where.firstSeenAt.gte = new Date(dto.firstSeenFrom);
      }
      if (dto.firstSeenTo) {
        where.firstSeenAt.lte = new Date(dto.firstSeenTo);
      }
    }

    const [items, total] =
      await Promise.all([
        prisma.contact.findMany({
          where,
          orderBy: {
            firstSeenAt: "desc"
          },
          skip,
          take: limit
        }),
        prisma.contact.count({ where })
      ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getContactById(
    tenantId: string,
    contactId: string
  ) {
    const contact =
      await prisma.contact.findFirst({
        where: {
          id: contactId,
          tenantId,
          isDeleted: false
        },
        include: {
          callRecords: {
            orderBy: {
              createdAt: "desc"
            },
            take: 5
          }
        }
      });

    if (!contact) {
      throw new BadRequestError(
        "Contact not found"
      );
    }

    return contact;
  }

  async getContactTimeline(
    tenantId: string,
    contactId: string
  ) {
    const contact =
      await prisma.contact.findFirst({
        where: {
          id: contactId,
          tenantId,
          isDeleted: false
        }
      });

    if (!contact) {
      throw new BadRequestError(
        "Contact not found"
      );
    }

    return prisma.callRecord.findMany({
      where: {
        tenantId,
        contactId
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  async updateContact(
    tenantId: string,
    contactId: string,
    dto: UpdateContactDto
  ) {
    const contact =
      await prisma.contact.findFirst({
        where: {
          id: contactId,
          tenantId,
          isDeleted: false
        }
      });

    if (!contact) {
      throw new BadRequestError(
        "Contact not found"
      );
    }

    const updatedTags = new Set(contact.tags);

    if (dto.addTags) {
      for (const tag of dto.addTags) {
        updatedTags.add(tag);
      }
    }

    if (dto.removeTags) {
      for (const tag of dto.removeTags) {
        updatedTags.delete(tag);
      }
    }

    return prisma.contact.update({
      where: {
        id: contact.id
      },
      data: {
        name: dto.name ?? contact.name,
        tags: Array.from(updatedTags)
      }
    });
  }

  async deleteContact(
    tenantId: string,
    contactId: string
  ) {
    const contact =
      await prisma.contact.findFirst({
        where: {
          id: contactId,
          tenantId,
          isDeleted: false
        }
      });

    if (!contact) {
      throw new BadRequestError(
        "Contact not found"
      );
    }

    return prisma.contact.update({
      where: {
        id: contact.id
      },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  }
}