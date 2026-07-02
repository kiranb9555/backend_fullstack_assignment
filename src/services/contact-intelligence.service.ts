import { Prisma } from "@prisma/client";

import { ExtractedData } from "../modules/intelligence/intelligence.schemas.js";

export class ContactIntelligenceService {

  async enrichContactFromIntelligence(
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
      /**
       * Fallback safety: ideally simulate.service.ts already created it.
       * But if for some reason it doesn't exist, create it here.
       */
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

    await tx.contact.updateMany({
      where: {
        id: contact.id,
        tenantId
      },
      data: {
        callCount: {
          increment: 1
        },
        name:
          contact.name ??
          extracted.name ??
          undefined,
        tags: Array.from(updatedTags)
      }
    });

    contact =
      await tx.contact.findFirst({
        where: {
          id: contact.id,
          tenantId,
          isDeleted: false
        }
      });

    if (!contact) {
      throw new Error(
        "Contact not found after intelligence enrichment"
      );
    }

    return contact;
  }
}
