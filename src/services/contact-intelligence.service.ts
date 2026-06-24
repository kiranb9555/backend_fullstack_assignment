import { Prisma } from "@prisma/client";

import { ExtractedData } from "../modules/intelligence/intelligence.schemas.js";

export class ContactIntelligenceService {

  async upsertContactFromIntelligence(
    tx: Prisma.TransactionClient,
    tenantId: string,
    callerMobile: string,
    extracted: ExtractedData
  ) {

    let contact =
      await tx.contact.findFirst({
        where: {
          tenantId,
          phoneNumber: callerMobile,
          isDeleted: false
        }
      });

    if (!contact) {
      contact =
        await tx.contact.create({
          data: {
            tenantId,
            phoneNumber: callerMobile,
            name: extracted.name ?? undefined,
            tags:
              extracted.intent
                ? [extracted.intent]
                : [],
            callCount: 1
          }
        });

      return contact;
    }

    const updatedTags =
      new Set(contact.tags);

    if (extracted.intent) {
      updatedTags.add(extracted.intent);
    }

    contact =
      await tx.contact.update({
        where: {
          id: contact.id
        },
        data: {
          name:
            contact.name ??
            extracted.name ??
            undefined,
          callCount: {
            increment: 1
          },
          tags: Array.from(updatedTags)
        }
      });

    return contact;
  }
}