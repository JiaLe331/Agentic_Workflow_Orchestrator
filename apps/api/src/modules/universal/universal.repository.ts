
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class UniversalRepository {
    constructor(@Inject(DB_CONNECTION) private readonly db: NodePgDatabase<typeof schema>) { }

    private getTable_(tableName: string) {
        const table = schema[tableName as keyof typeof schema];
        if (!table) {
            throw new BadRequestException(`Table ${tableName} not found`);
        }
        return table;
    }

    async findAll(tableName: string) {
        const table = this.getTable_(tableName);
        // @ts-ignore - Dynamic table access
        return this.db.select().from(table).orderBy(desc(table.updatedAt || table.createdAt || table.id));
    }

    async findOne(tableName: string, id: string) {
        const table = this.getTable_(tableName);
        // @ts-ignore - Dynamic access
        return this.db.select().from(table).where(eq(table.id, id));
    }

    async create(tableName: string, data: any) {
        const table = this.getTable_(tableName);
        // @ts-ignore
        return this.db.insert(table).values(data).returning();
    }

    async update(tableName: string, id: string, data: any) {
        const immutableTables = ['payroll_run', 'payslip', 'general_ledger', 'payrollRun', 'payslip', 'generalLedger'];
        if (immutableTables.includes(tableName)) {
            throw new BadRequestException(`Table ${tableName} is immutable. Updates are not allowed.`);
        }

        const table = this.getTable_(tableName);
        // @ts-ignore
        return this.db.update(table).set(data).where(eq(table.id, id)).returning();
    }
}
