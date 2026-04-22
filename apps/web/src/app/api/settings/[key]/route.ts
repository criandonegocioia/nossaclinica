import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  clinic: { name: 'OdontoFace', cnpj: '', cro: '', phone: '', email: '', address: '', logo: '' },
  notifications: { whatsappReminders: true, emailReminders: true, birthdayMessages: true, reminderHoursBefore: 24 },
  appearance: { theme: 'dark', primaryColor: '#0ea5e9', language: 'pt-BR', dateFormat: 'DD/MM/YYYY' },
  schedule: { workingDays: [1, 2, 3, 4, 5], startHour: 8, endHour: 18, slotDuration: 30, rooms: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala HOF'] },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { key } = await params;
    const row = await prisma.settings.findUnique({ where: { key } });
    return NextResponse.json(row?.value ?? DEFAULT_SETTINGS[key] ?? null);
  } catch (error) {
    console.error('Settings key error:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
