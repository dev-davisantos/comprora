import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../database/enums/order-status.enum';
import { BudgetIndicatorDto, BudgetService } from './budget.service';
import { PurchaseOrderRepository } from '../database/repositories/purchase-order.repository';

export interface SpendEntryDto {
  id: number;
  name: string;
  total: string;
}

export interface SupplierSpendEntryDto {
  id: number;
  name: string;
  total: string;
}

export interface DashboardDto {
  /** Σ (initialValue − finalValue) of non-cancelled orders. */
  totalSavings: string;
  /** Σ finalValue of non-cancelled orders. */
  totalSpend: string;
  spendBySegment: SpendEntryDto[];
  spendByProject: SpendEntryDto[];
  spendBySupplier: SupplierSpendEntryDto[];
  /** Present only when `?month=YYYY-MM` is given. */
  budget: BudgetIndicatorDto | null;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly orderRepository: PurchaseOrderRepository,
    private readonly budgetService: BudgetService,
  ) {}

  async summary(month?: string): Promise<DashboardDto> {
    const totals = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.finalValue), 0)', 'spend')
      .addSelect('COALESCE(SUM(order.initialValue - order.finalValue), 0)', 'savings')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .getRawOne<{ spend: string; savings: string }>();

    const spendBySegment = await this.spendGroupedBy('segment');
    const spendByProject = await this.spendGroupedByProject();
    const spendBySupplier = await this.spendGroupedBy('supplier');

    return {
      totalSavings: Number(totals?.savings ?? 0).toFixed(2),
      totalSpend: Number(totals?.spend ?? 0).toFixed(2),
      spendBySegment,
      spendByProject,
      spendBySupplier,
      budget: month !== undefined ? await this.budgetService.indicator(month) : null,
    };
  }

  private async spendGroupedBy(relation: 'segment' | 'supplier'): Promise<SpendEntryDto[]> {
    const alias = relation === 'segment' ? 'segment' : 'supplier';

    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin(`order.${relation}`, alias)
      .select(`${alias}.id`, 'id')
      .addSelect(`${alias}.${relation === 'segment' ? 'name' : 'displayName'}`, 'name')
      .addSelect('COALESCE(SUM(order.finalValue), 0)', 'total')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy(`${alias}.id`)
      .orderBy('total', 'DESC')
      .getRawMany<{ id: number; name: string; total: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      total: Number(row.total).toFixed(2),
    }));
  }

  /** Includes only projects with at least one non-cancelled linked order. */
  private async spendGroupedByProject(): Promise<SpendEntryDto[]> {
    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.orderProjects', 'op')
      .innerJoin('op.project', 'project')
      .select('project.id', 'id')
      .addSelect('project.name', 'name')
      .addSelect('COALESCE(SUM(order.finalValue), 0)', 'total')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .groupBy('project.id')
      .orderBy('total', 'DESC')
      .getRawMany<{ id: number; name: string; total: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      total: Number(row.total).toFixed(2),
    }));
  }
}
