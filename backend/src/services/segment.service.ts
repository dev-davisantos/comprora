import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSegmentDto, UpdateSegmentDto } from '../dto/segment.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { Segment } from '../database/entities/segment.entity';
import { SegmentRepository } from '../database/repositories/segment.repository';

@Injectable()
export class SegmentService {
  constructor(private readonly segmentRepository: SegmentRepository) {}

  async create(createSegmentDto: CreateSegmentDto): Promise<Segment> {
    const existing = await this.segmentRepository.findOne({
      where: { name: createSegmentDto.name },
    });

    if (existing) {
      throw new BusinessRuleException(`Segment name "${createSegmentDto.name}" already exists`);
    }

    const segment = this.segmentRepository.create(createSegmentDto);
    return this.segmentRepository.save(segment);
  }

  async findAll(): Promise<Segment[]> {
    return this.segmentRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Segment> {
    const segment = await this.segmentRepository.findOne({ where: { id } });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${id} not found`);
    }

    return segment;
  }

  async update(id: number, updateSegmentDto: UpdateSegmentDto): Promise<Segment> {
    const segment = await this.findOne(id);

    if (updateSegmentDto.name !== undefined && updateSegmentDto.name !== segment.name) {
      const existing = await this.segmentRepository.findOne({
        where: { name: updateSegmentDto.name },
      });

      if (existing) {
        throw new BusinessRuleException(
          `Segment name "${updateSegmentDto.name}" already exists`,
        );
      }
    }

    this.segmentRepository.merge(segment, updateSegmentDto);
    return this.segmentRepository.save(segment);
  }

  async remove(id: number): Promise<void> {
    const segment = await this.segmentRepository.findOne({
      where: { id },
      relations: { sectors: true },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${id} not found`);
    }

    if (segment.sectors.length > 0) {
      throw new BusinessRuleException(
        `Cannot delete segment ${id}: it still has sectors assigned`,
      );
    }

    await this.segmentRepository.remove(segment);
  }
}
