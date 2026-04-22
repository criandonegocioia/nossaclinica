const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Deleting mock schedules...');
  const res = await prisma.schedule.deleteMany({
    where: { googleEventId: null }
  });
  console.log('Deleted:', res.count);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
