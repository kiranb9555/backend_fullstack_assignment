import { prisma } from "../src/db/prisma.js";

import {
  cleanupDatabase,
  createTestTenant,
  createVirtualNumber
} from "../src/test/testUtils.js";

import { TranscriptService } from "../src/services/transcript.service.js";
import { AiExtractionService } from "../src/services/ai-extraction.service.js";
import { ContactIntelligenceService } from "../src/services/contact-intelligence.service.js";

describe(
  "Intelligence Pipeline",
  () => {

    const transcriptService =
      new TranscriptService();

    const aiExtractionService =
      new AiExtractionService();

    const contactIntelligenceService =
      new ContactIntelligenceService();

    beforeEach(async () => {
      await cleanupDatabase();
    });

    afterAll(async () => {
      await cleanupDatabase();
      await prisma.$disconnect();
    });

    it(
      "should generate transcript and extract structured data",
      async () => {

        const transcript =
          transcriptService.generateTranscript();

        expect(
          typeof transcript
        ).toBe("string");

        const extracted =
          await aiExtractionService
            .extractFromTranscript(
              transcript
            );

        expect(extracted).toHaveProperty("name");
        expect(extracted).toHaveProperty("intent");
        expect(extracted).toHaveProperty("sentiment");
        expect(extracted).toHaveProperty("callbackRequested");
      }
    );

    it(
      "should enrich an existing contact with tags and name",
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
              phoneNumber: "8888888888",
              tags: [],
              callCount: 1
            }
          });

        const callRecord =
          await prisma.callRecord.create({
            data: {
              tenantId: tenant.id,
              virtualNumberId:
                virtualNumber.id,
              contactId:
                contact.id,
              callerMobile:
                "8888888888",
              direction:
                "INBOUND",
              status:
                "ANSWERED",
              durationSec: 30
            }
          });

        const job =
          await prisma.intelligenceJob.create({
            data: {
              tenantId: tenant.id,
              callRecordId:
                callRecord.id,
              status: "PENDING"
            }
          });

        const extracted =
          await aiExtractionService
            .extractFromTranscript(
              "Hi this is Priya. Please call me back about pricing for office space."
            );

        await prisma.$transaction(
          async tx => {
            const updatedContact =
              await contactIntelligenceService
                .enrichContactFromIntelligence(
                  tx,
                  tenant.id,
                  "8888888888",
                  extracted
                );

            await tx.callRecord.update({
              where: {
                id: callRecord.id
              },
              data: {
                contactId:
                  updatedContact.id,
                aiSummary:
                  extracted.intent
                    ? `${extracted.intent} | ${extracted.sentiment}`
                    : `Voicemail processed | ${extracted.sentiment}`
              }
            });

            await tx.intelligenceJob.update({
              where: {
                id: job.id
              },
              data: {
                status: "DONE",
                transcript:
                  "Hi this is Priya. Please call me back about pricing for office space.",
                extractedData:
                  extracted,
                processingMs: 120
              }
            });
          }
        );

        const refreshedContact =
          await prisma.contact.findUnique({
            where: {
              id: contact.id
            }
          });

        expect(
          refreshedContact?.name
        ).toBe("Priya");

        expect(
          refreshedContact?.tags.length
        ).toBeGreaterThan(0);

        const refreshedJob =
          await prisma.intelligenceJob.findUnique({
            where: {
              id: job.id
            }
          });

        expect(
          refreshedJob?.status
        ).toBe("DONE");
      }
    );
  }
);