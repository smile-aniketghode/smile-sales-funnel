import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { DealsModule } from './modules/deals/deals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    TasksModule,
    DealsModule,
    DashboardModule,
    ContactsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
