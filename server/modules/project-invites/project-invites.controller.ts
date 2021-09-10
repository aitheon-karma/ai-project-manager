import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { ProjectInvite, ProjectInviteStatus, ProjectInviteSchema } from './project-invites.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { ProjectInviteService } from './project-invites.service';
import { ProjectsService } from '../projects/projects.service';
import _ = require('lodash');
import { ProjectRole, ProjectAccessType } from '../projects/project-roles/project-roles.model';
import { EventLogsApi } from '@aitheon/utilities-server';
import { SharedService } from '../shared/shared.service';

@Authorized()
@JsonController('/api/project-invites')
export class ProjectInvitesController {

  @Inject()
  projectInviteService: ProjectInviteService;

  @Inject()
  projectsService: ProjectsService;
  eventLogsApi: EventLogsApi;

  @Inject()
  sharedService: SharedService;

  constructor() {
    this.eventLogsApi = new EventLogsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/utilities`);
  }


  @Get('/')
  @OpenAPI({ summary: 'List invites', operationId: 'list' })
  @ResponseSchema(ProjectInvite, { isArray: true })
  async list(@QueryParam('projectId') projectId: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const query: any = {};
      if (projectId) query.project = projectId;
      else query.organization = current.organization._id;
      const result = await this.projectInviteService.list(query);
      return response.json(result);
    } catch (err) {
      logger.error('[list all invites]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/:inviteId')
  @OpenAPI({ summary: 'Get invite by id', operationId: 'findById' })
  @ResponseSchema(ProjectInvite)
  async findById(@Param('inviteId') inviteId: string, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      if (await this.projectInviteService.isInvitationExpired(inviteId)) {
        return response.status(403).send({ message: 'Project invite has been expired' });
      }

      const result = await this.projectInviteService.findById(inviteId, current.organization._id);
      return response.json(result);
    } catch (err) {
      logger.error('[get invite by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Post('/')
  @OpenAPI({ summary: 'Create an invite', operationId: 'create' })
  @ResponseSchema(ProjectInvite)
  async create(@Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      body.invitedBy = current.organization && current.organization._id;
      const projectInvite: any = await this.projectInviteService.create(body);

      // Send project invitation email to admins and owners of invitee org
      const admins = await this.projectsService.getAdminsAndOwners(projectInvite.organization._id);
      const mails = admins.map((admin: any) => { return admin.email; });
      const link = `https://${projectInvite.organization.domain + '.' || ''}${process.env.DOMAIN || 'dev.aitheon.com'}/project-manager/project-invitation/${projectInvite._id}`;

      const eventData = {
        eventName: 'Send project invite',
        emailHeaders: {
          to: mails,
          templateData: {
            header: 'Project Invite',
            projectName: projectInvite.project.name,
            message: `${current.organization.name} has invited you to project ${projectInvite.project.name}`,
            link: link,
            organizationName: projectInvite.organization.name,
          }
        }
      };
      this.eventLogsApi.eventLogsControllerCreate(eventData, { headers: { 'Authorization': 'JWT ' + current.token } });
      await this.sharedService.orgCreateTask(projectInvite, projectInvite.project.name, current);
      return response.json(projectInvite);
    } catch (err) {
      logger.error('[create invite]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Put('/:inviteId')
  @OpenAPI({ summary: 'Update invite by id', operationId: 'update' })
  @ResponseSchema(ProjectInvite)
  async update(@Param('inviteId') inviteId: string, @Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      if (await this.projectInviteService.isInvitationExpired(inviteId)) {
        return response.status(403).send({ message: 'Project invite has been expired' });
      }
      const invite: any = await this.projectInviteService.findById(inviteId);
      if (body && body.status && invite && invite.status && _.includes(['ACCEPTED', 'REJECTED'], invite.status)) {
        return response.status(422).send({ message: `Project invite already ${invite.status}` });
      }

      // Add an entry to project roles when invitation accepted
      if (body && body.status == ProjectInviteStatus.ACCEPTED) {
        const admins = await this.projectsService.getAdminsAndOwners(current.organization._id);
        const role = new ProjectRole();
        role.organization = current.organization._id;
        role.accessType = ProjectAccessType.SHARED;
        role.members = admins;
        await this.projectsService.addRole(invite.project, role);
      }

      if (body && body.status == (ProjectInviteStatus.ACCEPTED || ProjectInviteStatus.REJECTED)) {
        invite.status = body.status;
        await this.sharedService.createNotificationOnAcceptOrReject(invite, current);
      }

      if (body && body.status) {
        // Send project invitation response email to admins and owners of invitedBy org
        const admins = await this.projectsService.getAdminsAndOwners(invite.invitedBy._id);
        const mails = admins.map(admin => admin.email);

        const eventData = {
          eventName: 'Project invitation response',
          emailHeaders: {
            to: mails,
            templateData: {
              header: 'Project Invitation Response',
              projectName: invite.project.name,
              message: `${invite.organization.name} has ${body.status.toLowerCase()} the invitation for project ${invite.project.name}`,
              organizationName: invite.invitedBy.name,
            }
          }
        };
        this.eventLogsApi.eventLogsControllerCreate(eventData, { headers: { 'Authorization': 'JWT ' + current.token } });
      }

      const result = await this.projectInviteService.update(inviteId, body);
      return response.status(200).json(result);
    } catch (err) {
      logger.error('[update invite by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Delete('/:inviteId')
  @OpenAPI({ summary: 'make invite inactive by id', operationId: 'remove' })
  @ResponseSchema(ProjectInvite)
  async remove(@Param('inviteId') inviteId: string, @Body() body: any, @CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      const invite: any = await this.projectInviteService.findById(inviteId);

      if (!await this.projectsService.isProjectAdmin(current.user._id, current.organization._id, invite.project._id)) {
        return response.status(403).send({ message: 'You do not have permission to remove invitation' });
      }

      // Remove org from project roles
      if (invite.status == ProjectInviteStatus.ACCEPTED)
        await this.projectsService.removeRole(invite.project._id, invite.organization._id, 'SHARED');

      await this.projectInviteService.delete(inviteId);
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[remove invite by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


}
