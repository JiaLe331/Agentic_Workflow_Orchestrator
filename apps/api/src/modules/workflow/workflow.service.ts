import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowRepository, Workflow } from './workflow.repository';

@Injectable()
export class WorkflowService {
    constructor(private readonly workflowRepository: WorkflowRepository) { }

    async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        return this.workflowRepository.create(createWorkflowDto);
    }

    async findAll(): Promise<Workflow[]> {
        return this.workflowRepository.findAll();
    }

    async findOne(id: string): Promise<Workflow> {
        const workflow = await this.workflowRepository.findOne(id);
        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return workflow;
    }

    async update(id: string, updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
        await this.findOne(id); // Ensure exists before updating
        const updatedWorkflow = await this.workflowRepository.update(id, updateWorkflowDto);
        if (!updatedWorkflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return updatedWorkflow;
    }

    async remove(id: string): Promise<{ id: string }> {
        const deleted = await this.workflowRepository.remove(id);
        if (!deleted) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }
        return deleted;
    }

    async removeBulk(ids: string[]): Promise<{ id: string }[]> {
        return this.workflowRepository.removeBulk(ids);
    }
}

