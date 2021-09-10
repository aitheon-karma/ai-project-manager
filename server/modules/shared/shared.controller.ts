import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Request, Response } from 'express';
import { Current, logger, aclRequest } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { SharedService } from './shared.service';
import { environment } from '../../environment';


@Authorized()
@JsonController('/api/shared')
export class SharedController {
  @Inject()
  sharedService: SharedService;

  @Get('/org-members')
  @OpenAPI({ summary: 'Get members by organization', operationId: 'membersByOrgId' })
  async membersByOrganizationId(@CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('searchText') searchText: string) {
    try {
      const organization = current.organization._id;
      const members = await this.sharedService.getMembersByOrg(organization, searchText);
      return response.json(members);
    } catch (err) {
      return response.status(500).send({ message: 'Could not get the members' });
    }
  }

  @Get('/organizations')
  @OpenAPI({ summary: 'Get organizations', operationId: 'getOrgs' })
  async getOrganizations(@CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('searchText') searchText: string) {
    try {
      const members = await this.sharedService.getOrganizations(searchText);
      return response.json(members);
    } catch (err) {
      return response.status(500).send({ message: 'Could not get the members' });
    }
  }

  @Post('/drive-access')
  @OpenAPI({ summary: 'Get organizations', operationId: 'requestDriveAccess' })
  async requestDriveAccess(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request) {
    try {
      await aclRequest(current, request, {
        service: environment.service._id,
        level: 'FULL',
        key: current.organization ? current.organization._id : current.user._id,
        public: true
      });
      return response.status(200).send();
    } catch (err) {
      return response.status(501).send({message: 'Could not request drive access'});
    }

  }
}
