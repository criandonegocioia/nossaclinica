import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

const NAMES = [
  'João Silva', 'Maria Fernanda', 'Pedro Souza', 'Ana Carolina', 'Lucas Almeida',
  'Julia Ferreira', 'Mateus Costa', 'Beatriz Lima', 'Gabriel Gomes', 'Isabella Santos',
  'Rafael Pereira', 'Manuela Ribeiro', 'Felipe Martins', 'Mariana Carvalho', 'Thiago Rocha'
];

export async function seedFakePatients() {
  console.log('  Creating realistic dummy patients (with full history)...');
  
  const professional = await prisma.user.findFirst({ where: { role: { name: 'DENTISTA' } } });
  const hofPro = await prisma.user.findFirst({ where: { role: { name: 'HOF' } } });
  const procedures = await prisma.procedure.findMany();
  const rooms = await prisma.room.findMany();

  if (!professional || !hofPro || procedures.length === 0 || rooms.length === 0) {
    console.warn('  ⚠️ Cannot seed patients without dependencies (professional, rooms, procedures)');
    return;
  }

  for (let i = 0; i < 15; i++) {
    const today = new Date();
    // Some birthdays today!
    const birthDate = new Date(1980 + i, i % 3 === 0 ? today.getMonth() : (i % 12), i % 3 === 0 ? today.getDate() : ((i * 5) % 28));
    
    // Create patient
    const patient = await prisma.patient.create({
      data: {
        name: i % 2 === 0 ? `João Silva ${i}` : `Maria Santos ${i}`,
        email: `paciente${i}@email.com`,
        cpf: `1234567890${i}`,
        phoneMain: `1199999880${i}`,
        birthDate: birthDate,
        gender: i % 2 === 0 ? 'MASCULINO' : 'FEMININO',
        status: 'ATIVO',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    // Create Medical Record (Prontuário)
    await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        professionalId: professional.id,
        procedures: procedures[0].name,
        complaint: `Paciente avaliado. Iniciado tratamento padrão com boa evolução.`,
        dateTime: new Date(today.getTime() - 1000000000), // days ago
        isDraft: false,
      }
    });

    // Create Anamnese
    await prisma.anamnesis.create({
      data: {
        patientId: patient.id,
        professionalId: professional.id,
        data: {
          alergias: i % 3 === 0 ? 'Dipirona' : 'Nenhuma',
          medicamentos: 'Nenhum de uso contínuo',
          queixaPrincipal: 'Avaliação geral'
        },
        status: 'ASSINADA',
        filledAt: new Date(),
      }
    });

    // Create Document
    await prisma.document.create({
      data: {
        patientId: patient.id,
        title: 'Termo de Consentimento - Tratamento Padrão',
        type: 'CONTRATO',
        content: `Eu, ${NAMES[i]}, concordo com o tratamento odontológico estipulado...`,
      }
    });
    // Create Schedule (some for today, some for tomorrow)
    if (i < 6) {
      const startAt = new Date(today);
      startAt.setHours(8 + i, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setHours(startAt.getHours() + 1);

      await prisma.schedule.create({
        data: {
          patientId: patient.id,
          professionalId: i % 2 === 0 ? professional.id : hofPro.id,
          roomId: rooms[i % rooms.length].id,
          procedureId: procedures[i % procedures.length].id,
          startAt,
          endAt,
          status: i < 2 ? 'CONFIRMADO' : 'AGENDADO',
          createdById: professional.id,
        }
      });
    }

    // Create Finance
    await prisma.finance.create({
      data: {
        patientId: patient.id,
        description: `Consulta - ${NAMES[i]}`,
        amount: 250 + (i * 50),
        status: i % 3 === 0 ? 'PAGO' : 'PENDENTE',
        dueDate: new Date(today.getTime() + (i * 86400000)),
      }
    });
  }

  console.log('✅ Patients seeded successfully!');
}

if (require.main === module) {
  seedFakePatients()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
