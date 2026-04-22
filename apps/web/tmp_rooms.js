const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const rooms = await prisma.room.findMany();
  console.log(rooms.map(r => r.name));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
