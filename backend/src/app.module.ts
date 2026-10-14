import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/data-source';
import { DatabaseModule } from './database/database.module';
import { ProjectModule } from './project.module';
import { SegmentModule } from './segment.module';
import { SectorModule } from './sector.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    DatabaseModule,
    SegmentModule,
    SectorModule,
    ProjectModule,
  ],
})
export class AppModule {}

