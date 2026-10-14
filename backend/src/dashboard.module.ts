import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DatabaseModule } from './database/database.module';
import { DashboardService } from './services/dashboard.service';
import { BudgetService } from './services/budget.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, BudgetService],
})
export class DashboardModule {}
