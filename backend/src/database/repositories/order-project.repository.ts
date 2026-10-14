import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderProject } from '../entities/order-project.entity';

@Injectable()
export class OrderProjectRepository extends Repository<OrderProject> {
  constructor(
    @InjectRepository(OrderProject)
    repository: Repository<OrderProject>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
