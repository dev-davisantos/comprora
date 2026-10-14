import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentCondition } from '../enums/payment-condition.enum';
import { ServiceType } from '../enums/service-type.enum';
import { OrderProject } from './order-project.entity';
import { Sector } from './sector.entity';
import { Segment } from './segment.entity';
import { Supplier } from './supplier.entity';

@Entity({ name: 'purchase_orders' })
export class PurchaseOrder {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'integer' })
  orderNumber: number;

  @Column({ type: 'date' })
  issueDate: Date;

  /** Explicit even though derivable from sector/project — different meanings. */
  @ManyToOne(() => Segment, { nullable: false })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  /** Used when segment is STANDARD. */
  @ManyToOne(() => Sector, { nullable: true })
  @JoinColumn({ name: 'sector_id' })
  sector: Sector | null;

  /** Free-text resource/asset — used when segment is STANDARD. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  resource: string | null;

  @Column({ type: 'text' })
  description: string;

  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  /** Free text (no User entity in v1). */
  @Column({ type: 'varchar', length: 120 })
  requester: string;

  @Column({ type: 'simple-enum', enum: ServiceType })
  serviceType: ServiceType;

  /** Set when approving the order. */
  @Column({ type: 'date', nullable: true })
  authorizationDate: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initialValue: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalValue: string;

  @Column({ type: 'simple-enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  /** Nota fiscal. */
  @Column({ type: 'integer', nullable: true })
  invoiceNumber: number | null;

  /** Reference only — there is no paymentDate. */
  @Column({ type: 'simple-enum', enum: PaymentCondition, nullable: true })
  paymentCondition: PaymentCondition | null;

  /** Delivery deadline in days. */
  @Column({ type: 'integer' })
  deliveryDeadline: number;

  @Column({ type: 'date', nullable: true })
  deliveryDate: Date | null;

  @OneToMany(() => OrderProject, (orderProject) => orderProject.order)
  orderProjects: OrderProject[];
}
