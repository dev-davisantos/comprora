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
} from '@nestjs/common';
import { CreateSegmentDto, UpdateSegmentDto } from '../dto/segment.dto';
import { Segment } from '../database/entities/segment.entity';
import { SegmentService } from '../services/segment.service';

@Controller('segments')
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  @Post()
  create(@Body() createSegmentDto: CreateSegmentDto): Promise<Segment> {
    return this.segmentService.create(createSegmentDto);
  }

  @Get()
  findAll(): Promise<Segment[]> {
    return this.segmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Segment> {
    return this.segmentService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSegmentDto: UpdateSegmentDto,
  ): Promise<Segment> {
    return this.segmentService.update(id, updateSegmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.segmentService.remove(id);
  }
}
