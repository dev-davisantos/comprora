import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ProjectStatus } from '../database/enums/project-status.enum';
import { DECIMAL_12_2_MESSAGE, DECIMAL_12_2_REGEX } from './validation';
import { Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

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
