import Container, { Service, Inject } from 'typedi';
import { ProjectInvite, ProjectInviteSchema, ProjectInviteStatus } from './project-invites.model';
import { organizationPopulateDefaults, OrganizationSchema } from '../organization/organization.model';
import { projectPopulateDefaults } from '../projects/project.model';

@Service()
export class ProjectInviteService {

  constructor() {
  }
  async list(query: any): Promise<ProjectInvite[]> {
    return await ProjectInviteSchema.find(query).select({ expiryDate: 0 }).populate('project', projectPopulateDefaults).populate('organization', organizationPopulateDefaults).populate('invitedBy', organizationPopulateDefaults);
  }

  async findById(inviteId: string, organizationId?: string): Promise<ProjectInvite> {
    const query: any = {
      _id: inviteId
    };
    // allow only invitee / invitedBy to view the invitation
    if (organizationId) {
      query['$or'] = [{ organization: organizationId }, { invitedBy: organizationId }];
    }
    const invite = await ProjectInviteSchema.findOne(query).select({ expiryDate: 0 }).populate('project', projectPopulateDefaults).populate('organization', organizationPopulateDefaults).populate('invitedBy', organizationPopulateDefaults);
    if (!invite) {
      throw new Error('Not allowed');
    }
    return invite;
  }

  async create(invite: ProjectInvite): Promise<ProjectInvite> {

    const projectInvite: ProjectInvite = await ProjectInviteSchema.findOne({ organization: invite.organization, project: invite.project, status: ProjectInviteStatus.INVITED, invitedBy: invite.invitedBy, expiryDate: { $gt: new Date() } });
    if (projectInvite && projectInvite._id) {
      throw new Error('Organization already invited');
    }
    let projectInviteCreated = await ProjectInviteSchema.create(invite);

    projectInviteCreated = await ProjectInviteSchema.findById(projectInviteCreated._id).populate('organization', organizationPopulateDefaults + ' domain').populate('project', projectPopulateDefaults);
    return projectInviteCreated;
  }

  async update(inviteId: string, invite: ProjectInvite): Promise<ProjectInvite> {
    return await ProjectInviteSchema.findByIdAndUpdate(inviteId, invite, { new: true }).select({ expiryDate: 0 });
  }

  async delete(inviteId: string): Promise<any> {
    return await ProjectInviteSchema.findByIdAndDelete(inviteId);
  }

  async isInvitationExpired(inviteId: string): Promise<any> {
    const query = {
      _id: inviteId,
      expiryDate: {
        $lte: new Date()
      }
    };
    const projectInvite = await ProjectInviteSchema.findOne(query);
    return projectInvite && projectInvite._id ? true : false;
  }
}
