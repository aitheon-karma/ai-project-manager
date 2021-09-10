import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, QueryParams } from 'routing-controllers';
import { Inject } from 'typedi';
import { ProjectsOrder } from './projects-order.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { ProjectsOrderService } from './projects-order.service';


@Authorized()
@JsonController('/api/projects-order')
export class ProjectsOrderController {


  @Inject()
  private projectsOrderService: ProjectsOrderService;


  @Post('/')
  @OpenAPI({ summary: 'Create a projects order for user', operationId: 'createOrder' })
  @ResponseSchema(ProjectsOrder)
  async createOrder(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: { projects: string[] }) {
    try {
      const projectsOrder = await this.projectsOrderService.create(current.user._id, current.organization._id, body.projects);
      return response.json(projectsOrder);
    } catch (err) {
      logger.error('[ProjectsOrderController]: Could not create projects order', err);
      return response.status(400).send({ message: 'Could not create projects order' });
    }
  }

  @Get('/')
  @OpenAPI({ summary: 'Get the projects order for user', operationId: 'list' })
  @ResponseSchema(ProjectsOrder)
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const projectsOrder = await this.projectsOrderService.list(current.user._id, current.organization._id);
      return response.json(projectsOrder);
    } catch (err) {
      logger.error('[ProjectsOrderController]: Could not list projects order', err);
      return response.status(400).send({ message: 'Could not list projects order' });
    }
  }

}
