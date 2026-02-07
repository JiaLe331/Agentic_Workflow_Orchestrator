import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import { workflow } from '../../database/schema';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

type DrizzleDB = NodePgDatabase<typeof schema>;

// Use Drizzle's inferred type
export type Workflow = typeof workflow.$inferSelect;

@Injectable()
export class WorkflowRepository {
    constructor(@Inject(DB_CONNECTION) private readonly db: DrizzleDB) { }

    // Add a new workflow
    async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        const [newWorkflow] = await this.db
            .insert(workflow)
            .values({
                ...createWorkflowDto,
            })
            .returning();
        return newWorkflow;
    }

    // Fetch all workflows
    async findAll(): Promise<Workflow[]> {
        const workflows = await this.db.select().from(workflow);
        return workflows;
    }

    // Fetch a workflow by ID
    async findOne(id: string): Promise<Workflow | null> {
        const result = await this.db
            .select()
            .from(workflow)
            .where(eq(workflow.id, id))
            .limit(1);
        return result[0] || null;
    }

    // Update a workflow
    async update(
        id: string,
        updateWorkflowDto: UpdateWorkflowDto,
    ): Promise<Workflow | null> {
        const [updatedWorkflow] = await this.db
            .update(workflow)
            .set({
                ...updateWorkflowDto,
                updatedAt: new Date(),
            })
            .where(eq(workflow.id, id))
            .returning();
        return updatedWorkflow || null;
    }

    // Remove a workflow
    async remove(id: string): Promise<{ id: string } | null> {
        const deleted = await this.db.delete(workflow).where(eq(workflow.id, id)).returning({ id: workflow.id });
        return deleted[0] || null;
    }
}
