
import { Module } from '@nestjs/common';
import { UniversalController } from './universal.controller';
import { UniversalRepository } from './universal.repository';

@Module({
    controllers: [UniversalController],
    providers: [UniversalRepository],
})
export class UniversalModule { }
