const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    where: { googleRefreshToken: { not: null } },
    select: { id: true, name: true, googleRefreshToken: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
