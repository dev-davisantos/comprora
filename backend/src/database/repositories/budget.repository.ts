import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';

@Injectable()
export class BudgetRepository extends Repository<Budget> {
  constructor(
    @InjectRepository(Budget)
    repository: Repository<Budget>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
