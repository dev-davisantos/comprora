import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectRepository extends Repository<Project> {
  constructor(
    @InjectRepository(Project)
    repository: Repository<Project>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
