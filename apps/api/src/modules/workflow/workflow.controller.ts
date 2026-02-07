import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Workflow } from './workflow.repository';

@Controller('workflows')
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post()
    create(@Body() createWorkflowDto: CreateWorkflowDto): Promise<Workflow> {
        return this.workflowService.create(createWorkflowDto);
    }

    @Get()
    findAll(): Promise<Workflow[]> {
        return this.workflowService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Workflow> {
        return this.workflowService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto): Promise<Workflow> {
        return this.workflowService.update(id, updateWorkflowDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<{ id: string }> {
        return this.workflowService.remove(id);
    }
}
