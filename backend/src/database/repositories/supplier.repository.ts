import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';

@Injectable()
export class SupplierRepository extends Repository<Supplier> {
  constructor(
    @InjectRepository(Supplier)
    repository: Repository<Supplier>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
