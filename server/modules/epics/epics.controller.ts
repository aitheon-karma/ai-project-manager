import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Epic } from './epic.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { EpicsService } from './epics.service';



@Authorized()
@JsonController('/api/epics')
export class EpicsController {

  @Inject()
  epicsService: EpicsService;


  @Get('/')
  @OpenAPI({ summary: 'List epics', operationId: 'list' })
  @ResponseSchema(Epic, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @QueryParam('status') status: string, @QueryParam('searchText') searchText: string, @QueryParam('includeTasks') includeTasks: boolean) {
    try {
      const organizationId = current.organization._id;

      const result = await this.epicsService.findAll(organizationId, status, searchText, includeTasks);
      return response.json(result);
    } catch (err) {
      logger.error('[list all epics]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/:epicId')
  @OpenAPI({ summary: 'Get epic by id', operationId: 'findById' })
  @ResponseSchema(Epic)
  async findById(@Param('epicId') epicId: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.epicsService.getById(epicId);
      return response.json(result);
    } catch (err) {
      logger.error('[get epic by Id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Post('/')
  @OpenAPI({ summary: 'Create an epic', operationId: 'create' })
  @ResponseSchema(Epic)
  async create(@Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const organizationId = current.organization._id;
      body.organization = organizationId;

      const result = await this.epicsService.create(body, organizationId);
      return response.json(result);
    } catch (err) {
      logger.error('[create an epic]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Put('/:epicId')
  @OpenAPI({ summary: 'Update an epic', operationId: 'update' })
  @ResponseSchema(Epic)
  async update(@Param('epicId') epicId: string, @Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.epicsService.update(epicId, body, current.organization._id);
      return response.json(result);
    } catch (err) {
      logger.error('[update an epic]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/remove/:epicId')
  @OpenAPI({ summary: 'remove epic by id', operationId: 'remove' })
  @ResponseSchema(Epic)
  async remove(@Param('epicId') epicId: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any) {
    try {
      const { status } = body;
      await this.epicsService.remove(epicId, status, current.organization._id);
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[delete an epic]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  // helper to get the project id by reference and epic id

  @Get('/project/:epicId/:reference')
  @OpenAPI({ summary: 'Get project by epic', operationId: 'getProjectId' })
  async getProjectId(@Param('epicId') epicId: string, @Param('reference') reference: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any) {
    try {
      const taskMini = await this.epicsService.getProjectIdByEpic(epicId, reference);
      return response.json({projectId: taskMini.project});
    } catch (err) {
      logger.error('[getProjectId]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }



}
