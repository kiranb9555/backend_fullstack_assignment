import { prisma } from "../db/prisma.js";
import { generateAccessToken } from "../utils/jwt.js";

import { voicemailQueue } from "../queues/voicemail.queue.js";
import { contactCleanupQueue } from "../queues/contact-cleanup.queue.js";

export const createTestTenant = async () => {
  const tenant =
    await prisma.tenant.create({
      data: {
        businessName: "Test Business",
        mobile: `9${Math.floor(
          100000000 + Math.random() * 899999999
        )}`
      }
    });

  return tenant;
};

export const createAuthHeader = (
  tenantId: string
) => {
  const token =
    generateAccessToken({
      tenantId
    });

  return {
    Authorization: `Bearer ${token}`
  };
};

export const createNumberPoolEntry = async (
  e164Number = `+9199${Math.floor(
    10000000 + Math.random() * 89999999
  )}`
) => {
  return prisma.numberPool.create({
    data: {
      e164Number,
      isAssigned: false
    }
  });
};

export const createVirtualNumber = async (
  tenantId: string,
  label = "Sales Line"
) => {
  const pool =
    await createNumberPoolEntry();

  await prisma.numberPool.update({
    where: {
      id: pool.id
    },
    data: {
      isAssigned: true,
      assignedAt: new Date()
    }
  });

  return prisma.virtualNumber.create({
    data: {
      tenantId,
      numberPoolId: pool.id,
      e164Number: pool.e164Number,
      label
    }
  });
};

export const cleanupDatabase = async () => {
  await prisma.intelligenceJob.deleteMany();
  await prisma.callRecord.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.virtualNumber.deleteMany();
  await prisma.numberPool.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.walletTx.deleteMany();
  await prisma.tenant.deleteMany();
};

export const cleanupQueues = async () => {
  await voicemailQueue.drain(true);
  await voicemailQueue.clean(0, 1000, "completed");
  await voicemailQueue.clean(0, 1000, "failed");
  await voicemailQueue.clean(0, 1000, "wait");
  await voicemailQueue.clean(0, 1000, "delayed");
  await voicemailQueue.clean(0, 1000, "active");

  await contactCleanupQueue.drain(true);
  await contactCleanupQueue.clean(0, 1000, "completed");
  await contactCleanupQueue.clean(0, 1000, "failed");
  await contactCleanupQueue.clean(0, 1000, "wait");
  await contactCleanupQueue.clean(0, 1000, "delayed");
  await contactCleanupQueue.clean(0, 1000, "active");
};