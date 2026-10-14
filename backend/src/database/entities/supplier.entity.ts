import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'suppliers' })
export class Supplier {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  displayName: string;

  @Column({ type: 'varchar', length: 200 })
  corporateName: string;

  /** CNPJ stored as digits only (leading zeros preserved), exactly 14 characters. */
  @Column({ type: 'varchar', length: 14, unique: true })
  cnpj: string;

  @OneToMany(() => PurchaseOrder, (order) => order.supplier)
  orders: PurchaseOrder[];
}
