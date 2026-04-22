import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Patients
  'patient:view', 'patient:create', 'patient:edit', 'patient:delete', 'patient:export',
  // Medical Records
  'record:view', 'record:create', 'record:sign',
  // HOF
  'hof:view', 'hof:create', 'hof:sign',
  // Anamnesis
  'anamnesis:view', 'anamnesis:create', 'anamnesis:sign',
  // Photos
  'photo:view', 'photo:upload', 'photo:delete',
  // Documents
  'document:view', 'document:create', 'document:sign', 'document:delete',
  // Schedule
  'schedule:view', 'schedule:create', 'schedule:edit', 'schedule:delete',
  // Financial
  'finance:view', 'finance:create', 'finance:edit', 'finance:export',
  // Reports
  'report:view', 'report:export',
  // Users & Settings
  'user:view', 'user:create', 'user:edit', 'user:delete',
  'settings:view', 'settings:edit',
  // Audit
  'audit:view',
  // Integrations
  'integration:view', 'integration:manage',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSIONS, // Full access
  RECEPCAO: [
    'patient:view', 'patient:create', 'patient:edit',
    'record:view',
    'anamnesis:view',
    'photo:view',
    'document:view',
    'schedule:view', 'schedule:create', 'schedule:edit',
    'finance:view',
  ],
  DENTISTA: [
    'patient:view', 'patient:edit',
    'record:view', 'record:create', 'record:sign',
    'anamnesis:view', 'anamnesis:create', 'anamnesis:sign',
    'photo:view', 'photo:upload',
    'document:view', 'document:create', 'document:sign',
    'schedule:view', 'schedule:create',
    'report:view',
  ],
  HOF: [
    'patient:view', 'patient:edit',
    'record:view', 'record:create', 'record:sign',
    'hof:view', 'hof:create', 'hof:sign',
    'anamnesis:view', 'anamnesis:create', 'anamnesis:sign',
    'photo:view', 'photo:upload',
    'document:view', 'document:create', 'document:sign',
    'schedule:view', 'schedule:create',
    'report:view',
  ],
  FINANCEIRO: [
    'patient:view',
    'finance:view', 'finance:create', 'finance:edit', 'finance:export',
    'report:view', 'report:export',
    'schedule:view',
  ],
  MARKETING: [
    'patient:view',
    'report:view', 'report:export',
  ],
  PACIENTE: [
    'schedule:view',
    'document:view',
    'photo:view',
  ],
};

const PROCEDURES = [
  { name: 'Consulta Inicial', code: 'CONS01', durationDefault: 60, priceDefault: 200, category: 'ODONTOLOGIA' as const, colorCode: '#0B5B6F' },
  { name: 'Limpeza', code: 'LIMP01', durationDefault: 45, priceDefault: 250, category: 'ODONTOLOGIA' as const, colorCode: '#1FA2A6' },
  { name: 'Restauração', code: 'REST01', durationDefault: 60, priceDefault: 350, category: 'ODONTOLOGIA' as const, colorCode: '#4DA7B6' },
  { name: 'Canal', code: 'CANA01', durationDefault: 90, priceDefault: 800, category: 'ODONTOLOGIA' as const, colorCode: '#094D5E' },
  { name: 'Extração', code: 'EXTR01', durationDefault: 60, priceDefault: 400, category: 'ODONTOLOGIA' as const, colorCode: '#073F4D' },
  { name: 'Clareamento', code: 'CLAR01', durationDefault: 90, priceDefault: 600, category: 'AMBOS' as const, colorCode: '#80D9DB' },
  { name: 'Toxina Botulínica', code: 'HOF01', durationDefault: 45, priceDefault: 1200, category: 'HOF' as const, colorCode: '#FF6B6B' },
  { name: 'Preenchimento Labial', code: 'HOF02', durationDefault: 60, priceDefault: 1500, category: 'HOF' as const, colorCode: '#FF8A8A' },
  { name: 'Preenchimento Malar', code: 'HOF03', durationDefault: 60, priceDefault: 2000, category: 'HOF' as const, colorCode: '#E05555' },
  { name: 'Bioestimulador de Colágeno', code: 'HOF04', durationDefault: 45, priceDefault: 1800, category: 'HOF' as const, colorCode: '#FFB020' },
  { name: 'Fios de PDO', code: 'HOF05', durationDefault: 90, priceDefault: 2500, category: 'HOF' as const, colorCode: '#D4A017' },
  { name: 'Bichectomia', code: 'HOF06', durationDefault: 120, priceDefault: 3500, category: 'HOF' as const, colorCode: '#CC5500' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  console.log('  Creating permissions...');
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: name.replace(':', ' — ') },
    });
  }

  // Create roles and assign permissions
  console.log('  Creating roles...');
  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `Perfil ${roleName}` },
    });

    const perms = ROLE_PERMISSIONS[roleName] || [];
    for (const permName of perms) {
      const perm = await prisma.permission.findUnique({ where: { name: permName } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  // Create admin user
  console.log('  Creating admin user...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@clinica.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@clinica.com',
        passwordHash,
        roleId: adminRole.id,
      },
    });
  }

  // Create demo users
  console.log('  Creating demo users...');
  const demoUsers = [
    { name: 'Maria Recepção', email: 'maria@clinica.com', role: 'RECEPCAO' as RoleName },
    { name: 'Dr. João Silva', email: 'joao@clinica.com', role: 'DENTISTA' as RoleName },
    { name: 'Dra. Ana Costa', email: 'ana@clinica.com', role: 'HOF' as RoleName },
    { name: 'Carlos Financeiro', email: 'carlos@clinica.com', role: 'FINANCEIRO' as RoleName },
  ];

  for (const u of demoUsers) {
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (role) {
      const passwordHash = await bcrypt.hash('demo123', 10);
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { name: u.name, email: u.email, passwordHash, roleId: role.id },
      });
    }
  }

  // Create procedures
  console.log('  Creating procedures...');
  for (const proc of PROCEDURES) {
    await prisma.procedure.upsert({
      where: { code: proc.code },
      update: {},
      create: proc,
    });
  }

  // Create rooms
  console.log('  Creating rooms...');
  const rooms = ['Consultório 1', 'Consultório 2', 'Sala HOF', 'Sala de Raio-X'];
  for (const name of rooms) {
    const existing = await prisma.room.findFirst({ where: { name } });
    if (!existing) {
      await prisma.room.create({ data: { name } });
    }
  }

  console.log('✅ Base Seed completed!');
  
  const { seedFakePatients } = require('./seed-data');
  await seedFakePatients();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
