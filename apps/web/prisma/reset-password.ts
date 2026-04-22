import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.update({
    where: { email: 'admin@clinica.com' },
    data: { passwordHash: hash },
  });
  console.log('✅ Password reset for:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
