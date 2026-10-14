import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/data-source';
import { DatabaseModule } from './database/database.module';
import { SegmentModule } from './segment.module';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), DatabaseModule, SegmentModule],
})
export class AppModule {}

