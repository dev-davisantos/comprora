import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { CreateBudgetDto, UpdateBudgetDto } from '../dto/budget.dto';
import { BusinessRuleException } from '../exception/business-rule.exception';
import { OrderStatus } from '../database/enums/order-status.enum';
import { Budget } from '../database/entities/budget.entity';
import { BudgetRepository } from '../database/repositories/budget.repository';
import { PurchaseOrderRepository } from '../database/repositories/purchase-order.repository';

/** Week 5 covers the remaining days of the month (29–31). */
const WEEKS = [1, 2, 3, 4, 5];

@Injectable()
export class BudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly orderRepository: PurchaseOrderRepository,
  ) {}

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

  /**
   * `GET /budgets/indicator?month=YYYY-MM` — planned vs. realized per week of
   * the month. Realized = SUM of finalValue of orders issued in the week,
   * excluding CANCELLED. Weeks without a budget report null planned/remaining.
   * The budget never blocks order creation — visualization only.
   */
  async indicator(month: string): Promise<BudgetIndicatorDto> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BusinessRuleException(`Invalid month "${month}" — expected YYYY-MM`);
    }

    const budgets = await this.budgetRepository.find({
      where: { monthYear: toMonthStart(month) },
      order: { week: 'ASC' },
    });

    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select("CAST((CAST(strftime('%d', order.issueDate) AS INTEGER) + 6) / 7 AS INTEGER)", 'week')
      .addSelect('COALESCE(SUM(order.finalValue), 0)', 'total')
      .where("strftime('%Y-%m', order.issueDate) = :month", { month })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('week')
      .getRawMany<{ week: number; total: string }>();

    const realizedByWeek = new Map<number, string>();
    for (const row of rows) {
      realizedByWeek.set(Number(row.week), Number(row.total).toFixed(2));
    }

    const weeks: BudgetWeekIndicatorDto[] = WEEKS.map((week) => {
      const budget = budgets.find((b) => b.week === week);
      const realizedValue = realizedByWeek.get(week) ?? '0.00';
      const plannedValue = budget ? budget.plannedValue : null;

      return {
        week,
        plannedValue,
        realizedValue,
        remainingValue:
          plannedValue !== null
            ? (Number(plannedValue) - Number(realizedValue)).toFixed(2)
            : null,
      };
    });

    const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.plannedValue), 0).toFixed(2);
    const totalRealized = weeks.reduce((sum, w) => sum + Number(w.realizedValue), 0).toFixed(2);

    return {
      month,
      weeks,
      totalPlanned,
      totalRealized,
      totalRemaining: (Number(totalPlanned) - Number(totalRealized)).toFixed(2),
    };
  }
}

export interface BudgetWeekIndicatorDto {
  week: number;
  plannedValue: string | null;
  realizedValue: string;
  remainingValue: string | null;
}

export interface BudgetIndicatorDto {
  month: string;
  weeks: BudgetWeekIndicatorDto[];
  totalPlanned: string;
  totalRealized: string;
  totalRemaining: string;
}

/** Budgets are always stored at day 1 of the month (e.g. 2026-10-01). */
function toMonthStart(input: string): Date {
  const [year, month] = input.split('-');
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1));
}

function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}
