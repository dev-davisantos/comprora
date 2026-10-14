import { Module } from '@nestjs/common';
import { SegmentController } from './controllers/segment.controller';
import { DatabaseModule } from './database/database.module';
import { SegmentService } from './services/segment.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SegmentController],
  providers: [SegmentService],
})
export class SegmentModule {}
