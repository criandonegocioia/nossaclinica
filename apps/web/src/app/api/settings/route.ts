import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  clinic: { name: 'OdontoFace', cnpj: '', cro: '', phone: '', email: '', address: '', logo: '' },
  notifications: { whatsappReminders: true, emailReminders: true, birthdayMessages: true, reminderHoursBefore: 24 },
  appearance: { theme: 'dark', primaryColor: '#0ea5e9', language: 'pt-BR', dateFormat: 'DD/MM/YYYY' },
  schedule: { workingDays: [1, 2, 3, 4, 5], startHour: 8, endHour: 18, slotDuration: 30, rooms: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala HOF'] },
};

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const rows = await prisma.settings.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const data = await request.json();
    const upserts = Object.entries(data).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    );
    await Promise.all(upserts);

    const rows = await prisma.settings.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) { result[row.key] = row.value; }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
