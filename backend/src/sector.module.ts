import { Module } from '@nestjs/common';
import { SectorController } from './controllers/sector.controller';
import { DatabaseModule } from './database/database.module';
import { SectorService } from './services/sector.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SectorController],
  providers: [SectorService],
})
export class SectorModule {}
