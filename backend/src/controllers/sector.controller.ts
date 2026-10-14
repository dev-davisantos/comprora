import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSectorDto, UpdateSectorDto } from '../dto/sector.dto';
import { Sector } from '../database/entities/sector.entity';
import { SectorService } from '../services/sector.service';

@Controller('sectors')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  create(@Body() createSectorDto: CreateSectorDto): Promise<Sector> {
    return this.sectorService.create(createSectorDto);
  }

  @Get()
  findAll(
    @Query('segmentId', new ParseIntPipe({ optional: true })) segmentId?: number,
  ): Promise<Sector[]> {
    return this.sectorService.findAll(segmentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Sector> {
    return this.sectorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectorDto: UpdateSectorDto,
  ): Promise<Sector> {
    return this.sectorService.update(id, updateSectorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sectorService.remove(id);
  }
}
