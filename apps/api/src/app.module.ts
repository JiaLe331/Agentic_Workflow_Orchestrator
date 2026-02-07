import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UniversalModule } from './modules/universal/universal.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [DatabaseModule, UniversalModule, WorkflowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
