import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSectorDto, UpdateSectorDto } from '../dto/sector.dto';
import { Segment } from '../database/entities/segment.entity';
import { Sector } from '../database/entities/sector.entity';
import { SectorRepository } from '../database/repositories/sector.repository';
import { SegmentRepository } from '../database/repositories/segment.repository';

@Injectable()
export class SectorService {
  constructor(
    private readonly sectorRepository: SectorRepository,
    private readonly segmentRepository: SegmentRepository,
  ) {}

  async create(createSectorDto: CreateSectorDto): Promise<Sector> {
    const segment = await this.segmentRepository.findOne({
      where: { id: createSectorDto.segmentId },
    });

    if (!segment) {
      throw new NotFoundException(`Segment with id ${createSectorDto.segmentId} not found`);
    }

    const sector = this.sectorRepository.create({
      name: createSectorDto.name,
      segment,
    });

    return this.sectorRepository.save(sector);
  }

  async findAll(segmentId?: number): Promise<Sector[]> {
    return this.sectorRepository.find({
      where: segmentId !== undefined ? { segment: { id: segmentId } } : {},
      relations: { segment: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Sector> {
    const sector = await this.sectorRepository.findOne({
      where: { id },
      relations: { segment: true },
    });

    if (!sector) {
      throw new NotFoundException(`Sector with id ${id} not found`);
    }

    return sector;
  }

  async update(id: number, updateSectorDto: UpdateSectorDto): Promise<Sector> {
    const sector = await this.findOne(id);

    let segment: Segment | undefined;
    if (updateSectorDto.segmentId !== undefined) {
      const found = await this.segmentRepository.findOne({
        where: { id: updateSectorDto.segmentId },
      });

      if (!found) {
        throw new NotFoundException(`Segment with id ${updateSectorDto.segmentId} not found`);
      }

      segment = found;
    }

    if (updateSectorDto.name !== undefined) {
      sector.name = updateSectorDto.name;
    }

    if (segment) {
      sector.segment = segment;
    }

    return this.sectorRepository.save(sector);
  }

  async remove(id: number): Promise<void> {
    const sector = await this.findOne(id);
    await this.sectorRepository.remove(sector);
  }
}
