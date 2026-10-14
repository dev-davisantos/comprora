import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Segment } from './segment.entity';

@Entity({ name: 'sectors' })
export class Sector {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ManyToOne(() => Segment, (segment) => segment.sectors, { nullable: false })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;
}
