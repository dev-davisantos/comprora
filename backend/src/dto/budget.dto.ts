import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsInt, Matches, Max, Min } from 'class-validator';
import { DECIMAL_12_2_MESSAGE, DECIMAL_12_2_REGEX } from './validation';

export class CreateBudgetDto {
  /** Month/year — always normalized to day 1 (e.g. 2026-10-01). */
  @IsDateString()
  monthYear: string;

  /** Week of the month (1–5). */
  @IsInt()
  @Min(1)
  @Max(5)
  week: number;

  @Matches(DECIMAL_12_2_REGEX, { message: DECIMAL_12_2_MESSAGE })
  plannedValue: string;
}

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {}
