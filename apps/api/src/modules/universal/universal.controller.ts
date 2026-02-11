
import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UniversalRepository } from './universal.repository';

@Controller('universal')
export class UniversalController {
    constructor(private readonly repository: UniversalRepository) { }

    @Get(':table')
    async getAll(@Param('table') table: string) {
        return this.repository.findAll(table);
    }

    @Get(':table/:id')
    async getOne(@Param('table') table: string, @Param('id') id: string) {
        return this.repository.findOne(table, id);
    }

    @Post(':table')
    async create(@Param('table') table: string, @Body() body: any) {
        return this.repository.create(table, body);
    }

    @Put(':table/:id')
    async update(@Param('table') table: string, @Param('id') id: string, @Body() body: any) {
        return this.repository.update(table, id, body);
    }
}
