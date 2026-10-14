import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from '../entities/sector.entity';

@Injectable()
export class SectorRepository extends Repository<Sector> {
  constructor(
    @InjectRepository(Sector)
    repository: Repository<Sector>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
