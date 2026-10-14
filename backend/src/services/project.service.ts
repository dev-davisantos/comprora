import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { SegmentType } from '../database/enums/segment-type.enum';
import { Project } from '../database/entities/project.entity';
import { ProjectRepository } from '../database/repositories/project.repository';
import { SegmentRepository } from '../database/repositories/segment.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly segmentRepository: SegmentRepository,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const segment = await this.segmentRepository.findOne({
      where: { id: createProjectDto.segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${createProjectDto.segmentId} not found`);
    }

    if (segment.type !== SegmentType.PROJECT) {
      throw new BusinessRuleException(
        `Segment "${segment.name}" is not a PROJECT segment — projects cannot belong to it`,
      );
    }

    const project = this.projectRepository.create({
      name: createProjectDto.name,
      status: createProjectDto.status,
      startDate: new Date(createProjectDto.startDate),
      forecastEndDate: new Date(createProjectDto.forecastEndDate),
      realEndDate: createProjectDto.realEndDate ? new Date(createProjectDto.realEndDate) : null,
      budget: createProjectDto.budget,
      segment,
    });

    return this.projectRepository.save(project);
  }

  async findAll(segmentId?: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: segmentId !== undefined ? { segment: { id: segmentId } } : {},
      relations: { segment: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { segment: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    if (updateProjectDto.segmentId !== undefined) {
      const segment = await this.segmentRepository.findOne({
        where: { id: updateProjectDto.segmentId },
      });

      if (!segment) {
        throw new NotFoundException(`Segment with id ${updateProjectDto.segmentId} not found`);
      }

      if (segment.type !== SegmentType.PROJECT) {
        throw new BusinessRuleException(
          `Segment "${segment.name}" is not a PROJECT segment — projects cannot belong to it`,
        );
      }

      project.segment = segment;
    }

    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }

    if (updateProjectDto.status !== undefined) {
      project.status = updateProjectDto.status;
    }

    if (updateProjectDto.startDate !== undefined) {
      project.startDate = new Date(updateProjectDto.startDate);
    }

    if (updateProjectDto.forecastEndDate !== undefined) {
      project.forecastEndDate = new Date(updateProjectDto.forecastEndDate);
    }

    if (updateProjectDto.realEndDate !== undefined) {
      project.realEndDate = new Date(updateProjectDto.realEndDate);
    }

    if (updateProjectDto.budget !== undefined) {
      project.budget = updateProjectDto.budget;
    }

    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: { orderProjects: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    if (project.orderProjects.length > 0) {
      throw new BusinessRuleException(
        `Cannot delete project ${id}: it still has purchase orders linked`,
      );
    }

    await this.projectRepository.remove(project);
  }
}
