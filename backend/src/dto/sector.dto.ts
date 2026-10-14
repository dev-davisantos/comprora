import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsPositive, IsString, Length } from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @IsInt()
  @IsPositive()
  segmentId: number;
}

export class UpdateSectorDto extends PartialType(CreateSectorDto) {}
