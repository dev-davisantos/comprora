import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment } from '../entities/segment.entity';

@Injectable()
export class SegmentRepository extends Repository<Segment> {
  constructor(
    @InjectRepository(Segment)
    repository: Repository<Segment>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
