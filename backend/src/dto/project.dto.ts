import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';
import { ProjectStatus } from '../database/enums/project-status.enum';
import { DECIMAL_12_2_MESSAGE, DECIMAL_12_2_REGEX } from './validation';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  /** Segment of type PROJECT this project belongs to. */
  @IsInt()
  @IsPositive()
  segmentId: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  forecastEndDate: string;

  @IsOptional()
  @IsDateString()
  realEndDate?: string;

  @Matches(DECIMAL_12_2_REGEX, { message: DECIMAL_12_2_MESSAGE })
  budget: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
