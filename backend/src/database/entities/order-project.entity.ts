import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Project } from './project.entity';
import { PurchaseOrder } from './purchase-order.entity';

/** Join table: one project is composed of many orders; one order can compose several projects. */
@Entity({ name: 'order_project' })
@Unique(['order', 'project'])
export class OrderProject {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @ManyToOne(() => PurchaseOrder, (order) => order.orderProjects, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @ManyToOne(() => Project, (project) => project.orderProjects, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
