import { Module } from '@nestjs/common';
import { BudgetController } from './controllers/budget.controller';
import { DatabaseModule } from './database/database.module';
import { BudgetService } from './services/budget.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BudgetController],
  providers: [BudgetService],
})
export class BudgetModule {}
