import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { DatabaseModule } from './database/database.module';
import { PurchaseOrderService } from './services/purchase-order.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
