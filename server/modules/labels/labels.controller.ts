import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Label } from './label.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { LabelsService } from './labels.service';



@Authorized()
@JsonController('/api/labels')
export class LabelsController {

  @Inject()
  labelsService: LabelsService;


  @Get('/')
  @OpenAPI({ summary: 'List labels', operationId: 'list' })
  @ResponseSchema(Label, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.labelsService.list();
      return response.json(result);
    } catch (err) {
      logger.error('[list all labels]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/projects/:projectId')
  @OpenAPI({ summary: 'List labels by project', operationId: 'listByProject' })
  @ResponseSchema(Label, { isArray: true })
  async listByProject(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string, @QueryParam('searchText') searchText: string) {
    try {
      const result = await this.labelsService.listByProject(projectId, searchText);
      return response.json(result);
    } catch (err) {
      logger.error('[list all labels]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/:labelId')
  @OpenAPI({ summary: 'Get label by id', operationId: 'findById' })
  @ResponseSchema(Label)
  async findById(@Param('labelId') labelId: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.labelsService.findById(labelId);
      return response.json(result);
    } catch (err) {
      logger.error('[get label by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/project/:projectId')
  @OpenAPI({ summary: 'List labels by project ID', operationId: 'getByProjectId' })
  @ResponseSchema(Label, { isArray: true })
  async getByProjectId(
    @CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @Param('projectId') projectId: string
  ) {
    try {
      const result = await this.labelsService.list({ project: projectId });
      return response.json(result);
    } catch (err) {
      logger.error('[list labels by project id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Post('/')
  @OpenAPI({ summary: 'Create an label', operationId: 'create' })
  @ResponseSchema(Label)
  async create(@Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.labelsService.create(body, current.organization._id);
      return response.json(result);
    } catch (err) {
      logger.error('[create label]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:labelId')
  @OpenAPI({ summary: 'Update label by id', operationId: 'update' })
  @ResponseSchema(Label)
  async update(@Param('labelId') labelId: string, @Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const result = await this.labelsService.update(labelId, body);
      return response.status(200).json(result);
    } catch (err) {
      logger.error('[update label by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Delete('/:labelId')
  @OpenAPI({ summary: 'make label  inactive by id', operationId: 'remove' })
  @ResponseSchema(Label)
  async remove(@Param('labelId') labelId: string, @Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      await this.labelsService.delete(labelId);
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[remove label by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


}
