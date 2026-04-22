import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { PhotosModule } from './modules/photos/photos.module';
import { AuditModule } from './modules/audit/audit.module';
import { StockModule } from './modules/stock/stock.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { LeadsModule } from './modules/leads/leads.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AnamnesesModule } from './modules/anamneses/anamneses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    MedicalRecordsModule,
    SchedulingModule,
    PhotosModule,
    AuditModule,
    StockModule,
    MedicationsModule,
    LeadsModule,
    FinanceModule,
    SettingsModule,
    NotificationsModule,
    DocumentsModule,
    AnamnesesModule,
  ],
})
export class AppModule {}
