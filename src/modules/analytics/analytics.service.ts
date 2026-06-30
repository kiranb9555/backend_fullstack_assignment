import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

export class AnalyticsService {

  async getSummary(
    tenantId: string
  ) {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalCallsToday,
      missedCallsToday,
      newContactsThisWeek,
      topCallers,
      intelligenceJobs
    ] = await Promise.all([
      prisma.callRecord.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfToday
          }
        }
      }),

      prisma.callRecord.count({
        where: {
          tenantId,
          status: "MISSED",
          createdAt: {
            gte: startOfToday
          }
        }
      }),

      prisma.contact.count({
        where: {
          tenantId,
          isDeleted: false,
          firstSeenAt: {
            gte: startOfWeek
          }
        }
      }),

      prisma.contact.findMany({
        where: {
          tenantId,
          isDeleted: false
        },
        orderBy: {
          callCount: "desc"
        },
        take: 5,
        select: {
          id: true,
          phoneNumber: true,
          name: true,
          callCount: true,
          tags: true,
          firstSeenAt: true
        }
      }),

      prisma.intelligenceJob.findMany({
        where: {
          tenantId,
          status: "DONE",
          extractedData: {
            not: Prisma.JsonNull
          }
        },
        select: {
          extractedData: true
        }
      })
    ]);

    const sentimentBreakdown = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    for (const job of intelligenceJobs) {
      const extracted =
        job.extractedData as
          | {
              sentiment?: "positive" | "neutral" | "negative";
            }
          | null;

      const sentiment =
        extracted?.sentiment;

      if (
        sentiment === "positive" ||
        sentiment === "neutral" ||
        sentiment === "negative"
      ) {
        sentimentBreakdown[sentiment] += 1;
      }
    }

    return {
      totalCallsToday,
      missedCallsToday,
      newContactsThisWeek,
      topCallers,
      sentimentBreakdown
    };
  }
}