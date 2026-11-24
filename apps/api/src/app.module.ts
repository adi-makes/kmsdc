import { type DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { ApiEnv } from '@kmsdc/config/env';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { buildLoggerParams } from './common/logging/logger.config.js';
import { API_ENV } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/guards/auth.guard.js';
import { UsersModule } from './users/users.module.js';
import { ClinicModule } from './clinic/clinic.module.js';
import { EnquiriesModule } from './enquiries/enquiries.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { ClinicalModule } from './clinical/clinical.module.js';
import { CommunicationModule } from './communication/communication.module.js';
import { AutomationModule } from './automation/automation.module.js';

@Global()
@Module({})
class EnvModule {
  static register(env: ApiEnv): DynamicModule {
    return {
      module: EnvModule,
      providers: [{ provide: API_ENV, useValue: env }],
      exports: [API_ENV],
    };
  }
}

@Module({})
export class AppModule {
  static register(env: ApiEnv): DynamicModule {
    return {
      module: AppModule,
      imports: [
        EnvModule.register(env),
        LoggerModule.forRoot(buildLoggerParams(env)),
        PrismaModule,
        AuditModule,
        AuthModule,
        UsersModule,
        ClinicModule,
        EnquiriesModule,
        PatientsModule,
        AppointmentsModule,
        ClinicalModule,
        CommunicationModule,
        AutomationModule,
        HealthModule,
      ],
      providers: [
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    };
  }
}
