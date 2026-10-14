import { Module } from '@nestjs/common';
import { SupplierController } from './controllers/supplier.controller';
import { DatabaseModule } from './database/database.module';
import { SupplierService } from './services/supplier.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {}
