import { IsOptional, IsString, IsArray, IsObject, IsNotEmpty } from 'class-validator';

export class CreateWorkflowDto {
    @IsOptional()
    @IsObject()
    nodesJson?: Record<string, any>;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tablesInvolved?: string[];

    @IsOptional()
    @IsString()
    result?: string;

    @IsOptional()
    @IsString()
    uiType?: string;

    @IsOptional()
    @IsString()
    uiCode?: string;

    @IsOptional()
    @IsString()
    workflowUrl?: string;

    @IsOptional()
    @IsString()
    userPrompt?: string;

    @IsOptional()
    @IsArray()
    executionPlan?: any[];
}
