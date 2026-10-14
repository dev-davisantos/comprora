import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/budget.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { Budget } from '../database/entities/budget.entity';
import { BudgetRepository } from '../database/repositories/budget.repository';

@Injectable()
export class BudgetService {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    const monthYear = toMonthStart(dto.monthYear);

    const existing = await this.budgetRepository.findOne({
      where: { monthYear, week: dto.week },
    });

    if (existing) {
      throw new BusinessRuleException(
        `A budget for ${formatMonth(monthYear)} week ${dto.week} already exists (id ${existing.id})`,
      );
    }

    const budget = this.budgetRepository.create({
      monthYear,
      week: dto.week,
      plannedValue: dto.plannedValue,
    });

    return this.budgetRepository.save(budget);
  }

  async findAll(month?: string): Promise<Budget[]> {
    if (month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BusinessRuleException(`Invalid month "${month}" — expected YYYY-MM`);
    }

    const where: FindOptionsWhere<Budget> = {};
    if (month !== undefined) {
      where.monthYear = toMonthStart(month);
    }

    return this.budgetRepository.find({
      where,
      order: { monthYear: 'ASC', week: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({ where: { id } });

    if (!budget) {
      throw new NotFoundException(`Budget with id ${id} not found`);
    }

    return budget;
  }

  async update(id: number, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id);

    if (dto.monthYear !== undefined || dto.week !== undefined) {
      const monthYear =
        dto.monthYear !== undefined ? toMonthStart(dto.monthYear) : budget.monthYear;
      const week = dto.week ?? budget.week;

      const existing = await this.budgetRepository.findOne({ where: { monthYear, week } });
      if (existing && existing.id !== id) {
        throw new BusinessRuleException(
          `A budget for ${formatMonth(monthYear)} week ${week} already exists (id ${existing.id})`,
        );
      }

      budget.monthYear = monthYear;
      budget.week = week;
    }

    if (dto.plannedValue !== undefined) {
      budget.plannedValue = dto.plannedValue;
    }

    return this.budgetRepository.save(budget);
  }

  async remove(id: number): Promise<void> {
    const budget = await this.findOne(id);
    await this.budgetRepository.remove(budget);
  }
}

/** Budgets are always stored at day 1 of the month (e.g. 2026-10-01). */
function toMonthStart(input: string): Date {
  const [year, month] = input.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
