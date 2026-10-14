import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../entities/purchase-order.entity';

@Injectable()
export class PurchaseOrderRepository extends Repository<PurchaseOrder> {
  constructor(
    @InjectRepository(PurchaseOrder)
    repository: Repository<PurchaseOrder>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
