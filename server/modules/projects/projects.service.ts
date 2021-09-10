import { Service, Inject, Container } from 'typedi';
import { Project, ProjectWorkspaces, ProjectSchema, ProjectType, ProjectStatus, DriveFolderStatus } from './project.model';
import { ProjectRole, ProjectAccessType, ProjectMemberRoles } from './project-roles/project-roles.model';
import { userDefaultPopulate, UserSchema } from '../users/user.model';
import { organizationPopulateDefaults } from '../organization/organization.model';
import { logger, Current } from '@aitheon/core-server';
import _ = require('lodash');
import { ProjectTasksService } from '../project-tasks/project-tasks.service';
import { ObjectId } from 'mongodb';
import { LabelsService } from '../labels/labels.service';
import { GraphOutputsService } from '../core/graph-outputs.service';
import { Transporter, TransporterService, Event } from '@aitheon/transporter';
import { environment } from '../../environment';
import { JobSiteProject, JobSiteProjectsApi } from '@aitheon/job-site-server';


@Service()
@Transporter()
export class ProjectsService extends TransporterService {

  jobSiteProjectsApi: JobSiteProjectsApi;

  @Inject(type => GraphOutputsService)
  private graphService: GraphOutputsService;

  @Inject(type => ProjectTasksService)
  private projectTaskService: ProjectTasksService;

  @Inject(type => LabelsService)
  private labelsService: LabelsService;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.jobSiteProjectsApi = new JobSiteProjectsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/job-site`);
  }

  async create(organizationId: string, user: string, project: Project) {
    const role = new ProjectRole();
    role.organization = organizationId;
    role.accessType = ProjectAccessType.OWNER;
    role.members = [];
    const adminMembers = await this.getAdminsAndOwners(organizationId);

    adminMembers.forEach(m => {
      role.members.push({ user: m.user._id.toString(), role: ProjectMemberRoles.ADMIN });
    });
    if (!role.members.find(r => r.user === user)) {
      role.members.push({ user, role: ProjectMemberRoles.ADMIN });
    }
    project.roles = [role];
    project.workspaces = [ProjectWorkspaces.KANBAN]; // default for now
    project.createdBy = user;

    const projectId = new ObjectId();
    project._id = projectId.toHexString();
    this.broker.emit(
      'FoldersService.createServiceFolder',
      {
        userId: user,
        organizationId,
        projectId,
        projectSchemaName: ProjectSchema.collection.collectionName,
        serviceKey: environment.service._id
      },
      'DRIVE'
    );
    const createdProject = await ProjectSchema.create(project);
    const result = await this.findById(createdProject._id.toString());
    await this.graphService.projectCreated({ organization: organizationId, project: result });
    return result;
  }

  async checkCreateProjectFolder(organizationId: string, user: string, project: Project) {
    return await this.broker.call(
      'DRIVE.FoldersService.getServiceFolder',
      {
        userId: user,
        organizationId,
        projectId: project._id,
        projectSchemaName: ProjectSchema.collection.collectionName,
        serviceKey: environment.service._id
      }
    );
  }

  async isProjectAdmin(user: string, organization: string, projectId: string, accessType: ProjectAccessType = ProjectAccessType.OWNER): Promise<boolean> {
    const project = await ProjectSchema.findOne({
      '_id': projectId,
      'roles': {
        $elemMatch: {
          'organization': organization,
          'accessType': { $in: accessType ? [accessType] : [ProjectAccessType.OWNER, ProjectAccessType.SHARED] },
          'members': {
            $elemMatch: {
              'user': user,
              'role': ProjectMemberRoles.ADMIN
            }
          }
        }
      }
    });

    return !!project;
  }

  @Event()
  async updateProjectFolderStatus(payload: { projectId: string, status: DriveFolderStatus.CREATED | DriveFolderStatus.ERROR }) {
    const { projectId, status } = payload;
    await ProjectSchema.findByIdAndUpdate(projectId, { driveFolderStatus: status });
  }

  async hasProjectAccess(current: Current, projectId: string, readonly?: boolean): Promise<boolean> {

    const query = [{
      'roles.organization': current.organization._id,
      'roles.members.user': current.user._id,
      type: ProjectType.PRIVATE
    },
    {
      'roles.organization': current.organization._id,
      type: ProjectType.PUBLIC
    }];
    if (readonly) {
      query[0] = _.omit(query[0], 'roles.members.user');
    }

    const count = await ProjectSchema.countDocuments({ _id: projectId }).or(query);
    return count > 0;
  }


  async findById(projectId: string): Promise<Project> {
    return ProjectSchema.findById({ _id: projectId })
      .populate('roles.organization', organizationPopulateDefaults)
      .populate('roles.members.user', userDefaultPopulate)
      .lean();
  }


  async findByIdFiltered(projectId: string) {
    return ProjectSchema.findById({ _id: projectId }, 'issueBoardEnabled name');
  }



  async update(user: string, organization: string, project: Project) {

    // not to update roles directly
    if (!this.isProjectAdmin(user, organization, project._id)) {
      throw new Error('Not allowed');
    }
    delete project.roles;
    const result = await ProjectSchema.findByIdAndUpdate({ _id: project._id }, project, { new: true }).lean();
    await this.graphService.projectUpdated({ organization, project: result, specialReference: result._id });
    return result;
  }

  async addRole(projectId: string, role: ProjectRole) {
    const project = await ProjectSchema.findOne({ '_id': projectId, 'roles.organization': role.organization });

    if (project && project._id) {
      throw new Error('Role already added');
    }

    return ProjectSchema.findByIdAndUpdate(projectId, { $push: { roles: role } }, { new: true });
  }


  async list(user: string, organization: string, status: string = ProjectStatus.ACTIVE): Promise<Project[]> {
    return ProjectSchema.find({ status }).or([{
      'roles.organization': organization,
      'roles.members.user': user, type: ProjectType.PRIVATE
    },
    { 'roles.organization': organization, type: ProjectType.PUBLIC }])
      .populate('roles.organization', organizationPopulateDefaults)
      .populate('roles.members.user', userDefaultPopulate)
      .lean();
  }


  async findByOrganizationKey(key: string, organization: string) {
    return ProjectSchema.findOne({
      'roles.organization': organization,
      key: key,
      'roles.accessType': ProjectAccessType.OWNER,
      status: { $ne: ProjectStatus.DELETED }
    });
  }

  async findByOrg(organizationId: String): Promise<Project[]> {
    return ProjectSchema.find({ organization: organizationId });
  }

  async linkJobSiteProjects(projects: Project[], organizationId: string, token: string): Promise<Project[]> {
    const jobSiteProjects = (await this.jobSiteProjectsApi.listAll({ headers: { 'Authorization': `JWT ${token}`, 'organization-id': organizationId } })).body;
    projects.forEach((project: Project) => {
      const jobSiteProject = jobSiteProjects.find((jP: JobSiteProject) => jP.projectManagerProject && jP.projectManagerProject.toString() === project._id.toString());
      if (!!jobSiteProject) {
        project.jobSiteProject = jobSiteProject;
      }
    });
    return projects;
  }

  async getMembers(projectId: string, searchKey?: string) {
    const project = await this.findById(projectId);
    let members: any[];
    // if public return all the users in the org
    if (project.type === ProjectType.PRIVATE) {
      members = await this.getPrivateMembers(project, searchKey);
    } else if (project.type === ProjectType.PUBLIC) {

      members = await this.getPublicMembers(project, searchKey);
    }

    return members;
  }


  private async getPrivateMembers(project: Project, searchText?: string) {
    const allMembers =
      project.roles.reduce((prev, current) => {
        let members = current.members.map(m => ({ user: m.user, organization: current.organization, accessType: current.accessType, role: m.role }));
        if (searchText) {
          searchText = searchText.toLowerCase();
          const fullName = searchText.replace(/\s+/g, ' ').split(' ');
          if (fullName.length === 2) {
            members = members.filter(m => (m.user.profile.firstName.toLowerCase()).includes(fullName[0]) || (m.user.profile.lastName.toLowerCase()).includes(fullName[1]));
          } else {
            members = members.filter(m => (m.user.email === searchText
              || m.user.profile.firstName.toLowerCase()).includes(searchText)
              || (m.user.profile.lastName.toLowerCase()).includes(searchText));
          }
        }
        prev.push(...members);
        return prev;
      }, []);

    return allMembers;
  }

  private async getPublicMembers(project: Project, searchText?: string) {
    const organizations: string[] = project.roles.map(r => r.organization._id);
    let query: any;
    if (searchText) {
      let nameSearchQuery: any;
      const fullName = searchText.replace(/\s+/g, ' ').split(' ');
      nameSearchQuery = [{
        'profile.firstName': { $regex: searchText, $options: 'i' }
      },
      { 'profile.lastName': { $regex: searchText, $options: 'i' } }];

      if (fullName.length === 2) {
        nameSearchQuery = [{
          'profile.firstName': { $regex: fullName[0], $options: 'i' },
          'profile.lastName': { $regex: fullName[1], $options: 'i' }
        }];
      }
      query = {
        $and: [
          { 'roles.organization': { $in: organizations } },
          {
            $or: [
              { 'email': searchText },
              ...nameSearchQuery
            ]
          }
        ]
      };
    } else {
      query = {
        $and: [{ 'roles.organization': { $in: organizations } }]
      };
    }
    const users: any[] = await UserSchema.find(query, `${userDefaultPopulate} roles.organization`).lean();
    const members = [];
    // replace roles found from the project roles
    for (const user of users) {

      const userOrgRoles: string[] = user.roles
        .map((r: any) => r.organization.toString());
      const role = project.roles.find(r => userOrgRoles.includes(r.organization._id.toString()));
      const userMemberRole = role.members.find(m => m.user._id.toString() === user._id.toString());
      const member = {
        user: _.omit(user, 'roles'),
        organization: role.organization,
        accessType: role.accessType,
        role: userMemberRole ? userMemberRole.role : ProjectMemberRoles.MEMBER
      };
      members.push(member);
    }
    return members;
  }

  async getAdminsAndOwners(organizationId: string) {
    const query = {
      $or: [
        {
          roles: { $elemMatch: { organization: organizationId, role: 'Owner' } },
        },
        {
          roles: {
            $elemMatch:
            {
              $and: [
                { organization: { $eq: organizationId } },
                { services: { $elemMatch: { service: 'PROJECT_MANAGER', role: 'ServiceAdmin' } } }
              ]
            }
          }
        }
      ]
    };
    const users: any[] = await UserSchema.find(query, `${userDefaultPopulate} roles.organization`).lean();
    const members = [];
    for (const user of users) {
      const member = {
        user: user._id,
        role: ProjectMemberRoles.ADMIN,
        email: user.email
      };
      members.push(member);
    }
    return members;
  }

  async addMember(memberInfo: { user: string, memberRole: ProjectMemberRoles, organization: string, accessType: ProjectAccessType }, projectId: string) {
    return ProjectSchema.findOneAndUpdate({
      _id: projectId,
      'roles.organization': memberInfo.organization,
      'roles.accessType': memberInfo.accessType,
      'roles.members.user': { $ne: memberInfo.user }
    }
      ,
      {
        $push: {
          'roles.$.members': {
            user: memberInfo.user,
            role: memberInfo.memberRole
          }
        }
      }, { new: true });
  }
  async updateProjectStatus(projectId: string, status: string, current: Current): Promise<Project> {
    const project = await this.findById(projectId);
    if (status === ProjectStatus.ARCHIVED) {
      await this.projectTaskService.archiveProjectTasks(projectId);
      await this.graphService.projectArchived({ organization: current.organization._id, project: project, specialReference: project._id });
    }
    if (status === ProjectStatus.DELETED) {
      await this.projectTaskService.deleteProjectTasks(projectId, current);
      await this.labelsService.removeMany(projectId);
      await this.graphService.projectDeleted({ organization: current.organization._id, project: project, specialReference: project._id });
    }
    if (status === ProjectStatus.ACTIVE) {
      await this.projectTaskService.unarchiveProjectTasks(projectId);
    }

    const result = await ProjectSchema.findByIdAndUpdate(projectId, { status }, { new: true });
    return result;
  }

  async removeMember(memberInfo: { user: string, memberRole: ProjectMemberRoles, organization: string, accessType: ProjectAccessType }, projectId: string) {

    return ProjectSchema.findOneAndUpdate({
      _id: projectId,
      'roles.organization': memberInfo.organization,
      'roles.accessType': memberInfo.accessType,
      'roles.members.user': memberInfo.user,
      'roles.members.role': memberInfo.memberRole
    },
      {
        $pull: {
          'roles.$.members': {
            user: memberInfo.user,
            role: memberInfo.memberRole
          }
        }
      }, { new: true }).populate('roles.members.user', userDefaultPopulate);
  }

  async removeRole(projectId: string, organizationId: string, accessType: string) {
    return ProjectSchema.findOneAndUpdate({
      _id: projectId
    },
      {
        $pull: {
          'roles': {
            organization: organizationId,
            accessType: accessType
          }
        }
      }, { new: true });
  }

  async changeMemberRole(memberInfo: { user: string, memberRole: ProjectMemberRoles, organization: string, accessType: ProjectAccessType }, projectId: string) {

    const result = await ProjectSchema.updateOne({
      _id: projectId,
      'roles.organization': memberInfo.organization,
      'roles.accessType': memberInfo.accessType,
      'roles.members.user': memberInfo.user
    },
      {
        $set: {
          'roles.$[i].members.$[j].role': memberInfo.memberRole,
        },
      },
      {
        arrayFilters: [{
          'i.organization': memberInfo.organization,
        }, {
          'j.user': memberInfo.user
        }]
      });

    if (result.nModified) {
      return ProjectSchema.findById({ _id: projectId });
    }
  }

}
