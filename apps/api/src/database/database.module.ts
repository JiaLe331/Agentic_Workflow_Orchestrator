
import { Module, Global } from '@nestjs/common';
import { db } from './db';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
    providers: [
        {
            provide: DB_CONNECTION,
            useValue: db,
        },
    ],
    exports: [DB_CONNECTION],
})
export class DatabaseModule { }
