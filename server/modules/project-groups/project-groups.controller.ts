import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { ObjectId } from 'bson';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { ProjectGroupsService } from './project-groups.service';
import { ProjectGroup } from './project-group.model';



@Authorized()
@JsonController('/api/project-groups')
export class ProjectGroupsController {

    @Inject()
    projectGroupsService: ProjectGroupsService;


    @Get('/')
    @OpenAPI({ summary: 'List of project groups', operationId: 'list' })
    @ResponseSchema(ProjectGroup, { isArray: true })
    async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
        const organizationId = current.organization ? current.organization._id : undefined;
        const userId = current.user._id;
        const result = await this.projectGroupsService.findAll(organizationId, userId);
        return response.status(200).json(result);
    }

    // @Get('/:id')
    // @OpenAPI({ summary: 'Get project group by id', operationId: 'findById' })
    // @ResponseSchema(ProjectGroup)
    // async findById(@CurrentUser() current: Current, @Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    //     const result = await this.projectGroupService.findById(id);
    //     return response.status(200).json(result);
    // }

    // @Post('/')
    // @OpenAPI({ summary: 'Create a project group', operationId: 'create' })
    // @ResponseSchema(ProjectGroup)
    // async create(@CurrentUser() current: Current, @Body() body: any, @Req() request: Request, @Res() response: Response) {
    //     const organizationId = current.organization ? current.organization._id : undefined;
    //     const userId = current.user._id;
    //     body.organization = organizationId;
    //     body.user = userId;
    //     const result = await this.projectGroupService.create(body);
    //     return response.status(200).json(result);
    // }

    // @Put('/:id')
    // @OpenAPI({ summary: 'Update project group by id', operationId: 'update' })
    // @ResponseSchema(ProjectGroup)
    // async update(@CurrentUser() current: Current, @Param('id') id: string, @Body() body: any, @Req() request: Request, @Res() response: Response) {
    //     const result = await this.projectGroupService.update(id, body);
    //     return response.status(200).json(result);
    // }


    // @Delete('/:id')
    // @OpenAPI({ summary: 'Remove project group by id', operationId: 'remove' })
    // @ResponseSchema(ProjectGroup)
    // async remove(@CurrentUser() current: Current, @Param('id') id: string, @Body() body: any, @Req() request: Request, @Res() response: Response) {
    //     const result = this.projectGroupService.remove(id);
    //     return response.status(200).json(result);
    // }

}
