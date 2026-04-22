import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SETTINGS = {
  clinic: {
    name: 'OdontoFace',
    cnpj: '',
    cro: '',
    phone: '',
    email: '',
    address: '',
    logo: '',
  },
  notifications: {
    whatsappReminders: true,
    emailReminders: true,
    birthdayMessages: true,
    reminderHoursBefore: 24,
  },
  appearance: {
    theme: 'dark',
    primaryColor: '#0ea5e9',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
  },
  schedule: {
    workingDays: [1, 2, 3, 4, 5],
    startHour: 8,
    endHour: 18,
    slotDuration: 30,
    rooms: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala HOF'],
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.settings.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async update(data: Record<string, unknown>) {
    const upserts = Object.entries(data).map(([key, value]) =>
      this.prisma.settings.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      }),
    );
    await Promise.all(upserts);
    return this.findAll();
  }

  async getKey(key: string) {
    const row = await this.prisma.settings.findUnique({ where: { key } });
    return row?.value ?? (DEFAULT_SETTINGS as Record<string, unknown>)[key] ?? null;
  }
}
