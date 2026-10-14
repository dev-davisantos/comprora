import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/data-source';
import { DatabaseModule } from './database/database.module';
import { ProjectModule } from './project.module';
import { PurchaseOrderModule } from './purchase-order.module';
import { SegmentModule } from './segment.module';
import { SectorModule } from './sector.module';
import { SupplierModule } from './supplier.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    DatabaseModule,
    SegmentModule,
    SectorModule,
    ProjectModule,
    SupplierModule,
    PurchaseOrderModule,
  ],
})
export class AppModule {}

