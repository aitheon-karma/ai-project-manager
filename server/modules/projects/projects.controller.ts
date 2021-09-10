import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, QueryParams } from 'routing-controllers';
import { Inject } from 'typedi';
import { ProjectsService } from './projects.service';
import { Project } from './project.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import _ = require('lodash');
import { SharedService } from '../shared/shared.service';
import { ProjectTasksService } from '../project-tasks/project-tasks.service';
import { ProjectTask, ProjectTasksFilter } from '../project-tasks/project-task.model';
import { EpicsService } from '../epics/epics.service';
import { SystemGraphService } from '../shared/system-graph.service';

const forbiddenResponse = { message: 'Forbidden' };


@Authorized()
@JsonController('/api/projects')
export class ProjectsController {

  @Inject()
  sharedService: SharedService;

  @Inject()
  private projectsService: ProjectsService;

  @Inject()
  private projectTaskService: ProjectTasksService;

  @Inject()
  private epicsService: EpicsService;

  @Inject()
  systemGraphService: SystemGraphService;

  @Post('/')
  @OpenAPI({ summary: 'Create a project', operationId: 'create' })
  @ResponseSchema(Project)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() project: Project) {
    try {
      const projectExists = await this.projectsService.findByOrganizationKey(project.key, current.organization._id);
      if (projectExists) {
        return response.status(400).send({ 'message': 'Project Key already exists' });
      }
      const createdProject = await this.projectsService.create(current.organization._id, current.user._id, project);
      this.systemGraphService.createProjectSubgraph(project.name, createdProject._id, current);
      return response.json(createdProject);
    } catch (err) {
      logger.error('[ProjectController]: Could not create project', err);
      return response.status(400).send({ message: 'Could not create the project' });
    }
  }

  @Get('/')
  @OpenAPI({ summary: 'Get the list of projects', operationId: 'list' })
  @ResponseSchema(Project, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @QueryParam('status') status: string, @QueryParam('minified') minified: boolean, @QueryParam('linkJobSiteProjects') linkJobSiteProjects: boolean) {
    let projects = await this.projectsService.list(current.user._id, current.organization._id, status);

    if (linkJobSiteProjects) {
      projects = await this.projectsService.linkJobSiteProjects(projects, current.organization._id, current.token);
    }

    if (!minified) {
      return response.json(projects);
    } else {
      return response.json(projects && projects.length && _.map(projects, (project: any) => { return { _id: project._id, name: project.name }; }) || []);
    }
  }

  @Get('/:projectId/projectFolder')
  @OpenAPI({ summary: 'Check and get project folder', operationId: 'getAddProjectFolder' })
  @ResponseSchema(Project)
  async getAddProjectFolder(
    @CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @Param('projectId') projectId: string,
    @QueryParam('readOnly') readOnly: boolean
  ) {

    if (!await this.projectsService.hasProjectAccess(current, projectId, readOnly)) {
      return response.status(403).send({ message: 'Forbidden' });
    }

    const project = await (readOnly ? this.projectsService.findByIdFiltered(projectId) : this.projectsService.findById(projectId));
    const folder = await this.projectsService.checkCreateProjectFolder(current.organization && current.organization._id, current.user && current.user._id, project);

    return response.json(folder);
  }

  @Get('/:projectId')
  @OpenAPI({ summary: 'Get the list of projects', operationId: 'getById' })
  @ResponseSchema(Project)
  async getById(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string, @QueryParam('readOnly') readOnly: boolean) {

    if (!await this.projectsService.hasProjectAccess(current, projectId, readOnly)) {
      return response.status(403).send({ message: 'Forbidden' });
    }
    const project = await (readOnly ? this.projectsService.findByIdFiltered(projectId) : this.projectsService.findById(projectId));
    return response.json(project);
  }


  @Post('/:projectId')
  @OpenAPI({ summary: 'Update a project', operationId: 'update' })
  @ResponseSchema(Project)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Param('projectId') projectId: string, @Req() request: Request, @Body() project: Project) {
    try {
      project._id = projectId;
      const updatedProject = await this.projectsService.update(current.organization._id, current.user._id, project);
      return response.json(updatedProject);
    } catch (err) {
      logger.error('[ProjectController]: Could not update the project', err);
      return response.status(400).send({ message: 'Could not update the project' });
    }
  }


  /* Member controllers below */

  @Get('/:projectId/members')
  @OpenAPI({ summary: 'Get members of the project', operationId: 'members' })
  async members(@CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('searchText') searchText: string,
    @Param('projectId') projectId: string) {
    try {
      if (!await this.projectsService.hasProjectAccess(current, projectId)) {
        return response.status(403).send({ message: 'Forbidden' });
      }
      const members = await this.projectsService.getMembers(projectId, searchText);
      return response.json(members);
    } catch (err) {
      return response.status(500).send({ message: 'Could not get the members' });
    }
  }

  @Post('/:projectId/members')
  @OpenAPI({ summary: 'Add member to a project', operationId: 'addMember' })
  @ResponseSchema(Project)
  async addMember(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response, @Param('projectId') projectId: string,
    @Body() memberInfo: any) {
    try {
      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId)) {
        return response.status(403).send({ message: 'You do not have permission to add a member' });
      }
      memberInfo.organization = current.organization._id;
      const result = await this.projectsService.addMember(memberInfo, projectId);

      if (!result) {
        return response.status(400).send({ message: 'Member already present' });
      }

      return response.json(result);
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Post('/:projectId/multiple/members')
  @OpenAPI({ summary: 'Add members to a project', operationId: 'addMembers' })
  @ResponseSchema(Project)

  async addMembers(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('projectId') projectId: string, @Body() body: any) {
    try {                                                                                                   // temp fix
      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId, body[0].accessType)) {
        return response.status(403).send({ message: 'You do not have permission to add a member' });
      }
      for (const memberInfo of body) {
        memberInfo.organization = current.organization._id;
        await this.projectsService.addMember(memberInfo, projectId);
        this.sharedService.memberCreateTask(memberInfo, projectId, current);
      }
      const project = await this.projectsService.findById(projectId);
      return response.status(200).json(project);
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Put('/:projectId/members/remove')
  @OpenAPI({ summary: 'Remove a member', operationId: 'removeMember' })
  @ResponseSchema(Project)
  async removeMember(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response, @Param('projectId') projectId: string,
    @Body() memberInfo: any) {
    try {
      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId, memberInfo.accessType)) {
        return response.status(403).send({ message: 'You do not have permission to remove a member' });
      }
      memberInfo.organization = current.organization._id;
      const result = await this.projectsService.removeMember(memberInfo, projectId);

      if (!result) {
        return response.status(400).send({ message: 'Member not found' });
      }
      return response.json(result);
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Put('/:projectId/members')
  @OpenAPI({ summary: 'Remove a member', operationId: 'changeMemberRole' })
  @ResponseSchema(Project)
  async changeMemberRole(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response,
    @Param('projectId') projectId: string,
    @Body() memberInfo: any) {
    try {
      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId, memberInfo.accessType)) {
        return response.status(403).send({ message: 'Not allowed' });
      }
      memberInfo.organization = current.organization._id;
      const result = await this.projectsService.changeMemberRole(memberInfo, projectId);
      if (!result) {
        return response.status(400).send({ message: 'Member not found' });
      }
      return response.json(result);
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Put('/:projectId/status')
  @OpenAPI({ summary: 'update project status', operationId: 'updateProjectStatus' })
  @ResponseSchema(Project)
  async updateProjectStatus(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response, @Param('projectId') projectId: string, @Body() body: { status: string }) {
    try {
      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId)) {
        return response.status(403).send({ message: 'Not allowed' });
      }
      const { status } = body;
      const result = await this.projectsService.updateProjectStatus(projectId, status, current);
      return response.json(result);
    } catch (err) {
      return response.status(400).send({ message: 'Forbidden' });
    }
  }

  @Get('/:projectId/is-admin')
  @OpenAPI({ summary: 'Check if user is project admin', operationId: 'isAdmin' })
  @ResponseSchema(Project)
  async isAdmin(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response, @Param('projectId') projectId: string) {
    try {

      const project = await this.projectsService.findById(projectId);
      // tslint:disable-next-line: no-null-keyword
      const isAdmin = await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, projectId, null);
      const currentRole = _.find(project.roles, role => role.organization._id == current.organization._id);
      return response.json({
        admin: isAdmin,
        accessType: currentRole.accessType
      });
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Get('/:projectId/access')
  @OpenAPI({ summary: 'Check if user has project access', operationId: 'hasProjectAccess' })
  async hasProjectAccess(@CurrentUser() current: Current, @Req() request: Request, @Res() response: Response, @Param('projectId') projectId: string, @QueryParam('readOnly') readOnly: boolean) {
    try {

      const hasAccess = !!await this.projectsService.hasProjectAccess(current, projectId, readOnly);
      return response.json({
        hasAccess
      });
    } catch (err) {
      return response.status(400).send({ message: err.message });
    }
  }

  @Post('/search/tasks')
  @OpenAPI({ summary: 'Search projects tasks', operationId: 'search' })
  @ResponseSchema(ProjectTask, { isArray: true })
  async search(@CurrentUser() current: Current, @QueryParam('countComments') countComments: boolean, @Res() response: Response, @Req() request: Request, @Body() filter: ProjectTasksFilter) {
    try {
      const projects = await this.projectsService.list(current.user._id, current.organization._id);
      let hasAccess = true;
      if (filter.epic) {
        hasAccess = await this.epicsService.hasEpicAccess(filter.epic, current.organization._id);
      }
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      if (filter.project) {
        delete filter.project;
      }
      if (!filter.projects) {
        filter.projects = projects.map(project => project._id);
      }
      filter.organization = current.organization._id;
      const result = await this.projectTaskService.advancedSearch(filter, countComments);
      return response.json(result);
    } catch (err) {
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/:organizationId/organization')
    @OpenAPI({ summary: 'List project by organization', operationId: 'listByOrg' })
    async listByOrg(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('organizationId') orgId: string) {
      const projects = await this.projectsService.findByOrg(orgId);
      return response.json(projects);
  }
}
