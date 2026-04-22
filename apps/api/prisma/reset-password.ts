import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const hash = await argon2.hash('admin123');
  const user = await prisma.user.update({
    where: { email: 'admin@clinica.com' },
    data: { passwordHash: hash },
  });
  console.log('✅ Password reset for:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
