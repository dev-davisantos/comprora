import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SegmentType } from '../enums/segment-type.enum';
import { Sector } from './sector.entity';

@Entity({ name: 'segments' })
export class Segment {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  name: string;

  @Column({ type: 'simple-enum', enum: SegmentType })
  type: SegmentType;

  @OneToMany(() => Sector, (sector) => sector.segment)
  sectors: Sector[];
}
