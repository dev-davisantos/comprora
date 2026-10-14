import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { dateTransformer, moneyTransformer } from '../transformers';

/**
 * Budget per month and week of the month (visualization only — never blocks order creation).
 * `monthYear` is always day 1 (e.g. 2026-10-01).
 */
@Entity({ name: 'budgets' })
@Unique(['monthYear', 'week'])
export class Budget {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'date', transformer: dateTransformer })
  monthYear: Date;

  /** Week of the month (1–5). */
  @Column({ type: 'integer' })
  week: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: moneyTransformer })
  plannedValue: string;
}
