import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UniversalModule } from './modules/universal/universal.module';

@Module({
  imports: [DatabaseModule, UniversalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
