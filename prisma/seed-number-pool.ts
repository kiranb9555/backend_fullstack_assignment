import { prisma } from "../src/db/prisma.js";

const numbers = [
  "+919900000001",
  "+919900000002",
  "+919900000003",
  "+919900000004",
  "+919900000005",
  "+919900000006",
  "+919900000007",
  "+919900000008",
  "+919900000009",
  "+919900000010"
];

const main = async () => {
  for (const e164Number of numbers) {
    await prisma.numberPool.upsert({
      where: {
        e164Number
      },
      update: {},
      create: {
        e164Number,
        isAssigned: false
      }
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });