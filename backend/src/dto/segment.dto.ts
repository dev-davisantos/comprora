import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { SegmentType } from '../database/enums/segment-type.enum';

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @IsEnum(SegmentType)
  type: SegmentType;
}

export class UpdateSegmentDto extends PartialType(CreateSegmentDto) {}
