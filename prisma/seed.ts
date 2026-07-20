import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertSeedEnv } from "../lib/env";

const prisma = new PrismaClient();

async function main() {
  const { email, password } = assertSeedEnv();

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id }, // defaults: CRC reporting, zero starting balance, rates unset
  });

  await prisma.allocationSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id }, // default: no allocation until the owner sets one
  });

  await prisma.category.upsert({
    where: { userId_name: { userId: user.id, name: "Uncategorized" } },
    update: {},
    create: { userId: user.id, name: "Uncategorized" },
  });

  console.log(`Seed complete: owner account ${email} ready (password stored as bcrypt hash).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
