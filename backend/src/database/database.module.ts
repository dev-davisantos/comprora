import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './entities/budget.entity';
import { OrderProject } from './entities/order-project.entity';
import { Project } from './entities/project.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { Sector } from './entities/sector.entity';
import { Segment } from './entities/segment.entity';
import { Supplier } from './entities/supplier.entity';
import { BudgetRepository } from './repositories/budget.repository';
import { OrderProjectRepository } from './repositories/order-project.repository';
import { ProjectRepository } from './repositories/project.repository';
import { PurchaseOrderRepository } from './repositories/purchase-order.repository';
import { SectorRepository } from './repositories/sector.repository';
import { SegmentRepository } from './repositories/segment.repository';
import { SupplierRepository } from './repositories/supplier.repository';

const entities = [Segment, Sector, Project, Supplier, PurchaseOrder, OrderProject, Budget];

const repositories = [
  SegmentRepository,
  SectorRepository,
  ProjectRepository,
  SupplierRepository,
  PurchaseOrderRepository,
  OrderProjectRepository,
  BudgetRepository,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...repositories],
  exports: [...repositories],
})
export class DatabaseModule {}
