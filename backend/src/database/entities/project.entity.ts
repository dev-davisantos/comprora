import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProjectStatus } from '../enums/project-status.enum';
import { OrderProject } from './order-project.entity';
import { Segment } from './segment.entity';

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'simple-enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  forecastEndDate: Date;

  @Column({ type: 'date', nullable: true })
  realEndDate: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budget: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: '0' })
  realCost: string;

  @ManyToOne(() => Segment, { nullable: false })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @OneToMany(() => OrderProject, (orderProject) => orderProject.project)
  orderProjects: OrderProject[];
}
