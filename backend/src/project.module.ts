import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { DatabaseModule } from './database/database.module';
import { ProjectService } from './services/project.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}
