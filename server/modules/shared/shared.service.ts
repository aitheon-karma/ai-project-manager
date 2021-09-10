import { Service, Inject, Container } from 'typedi';
import { ProjectRole, ProjectAccessType, ProjectMemberRoles } from '../projects/project-roles/project-roles.model';
import { userDefaultPopulate, UserSchema } from '../users/user.model';
import { organizationPopulateDefaults, OrganizationSchema } from '../organization/organization.model';
import { logger, Current } from '@aitheon/core-server';
import _ = require('lodash');
import { TasksApi } from '@aitheon/orchestrator-server';
import { ProjectSchema } from '../projects/project.model';
import { environment } from '../../environment';
import { Comment } from '../comments/comment.model';
import { ProjectTask, TaskNotify } from '../project-tasks/project-task.model';

@Service()
export class SharedService {

  tasksApi: TasksApi;
  constructor() {
    this.tasksApi = new TasksApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/orchestrator`);
  }

  async getMembersByOrg(organization: string, searchText: string) {
    let query: any;
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
        { 'roles.organization': organization },
        {
          $or: [
            { 'email': { $regex: searchText, $options: 'i' } },
            ...nameSearchQuery
          ]
        }
      ]
    };
    const users: any[] = await UserSchema.find(query, `${userDefaultPopulate} roles.organization`).lean();
    const members = [];
    // replace roles found from the project roles
    for (const user of users) {
      const userOrgRoles: string[] = user.roles
        .map((r: any) => r.organization.toString());
      const member = {
        user: _.omit(user, 'roles'),
        organization: organization,
        role: ProjectMemberRoles.MEMBER
      };
      members.push(member);
    }
    return members;
  }

  async getOrganizations(term: string) {
    return await OrganizationSchema.find({ name: new RegExp(term, 'i') }, `${organizationPopulateDefaults} domain`);
  }

  async memberCreateTask(memberInfo: any, projectId: string, current: any) {

    const projectDetails: any = await ProjectSchema.findById({ _id: projectId });
    const userDetails: any = await UserSchema.findOne({ '_id': memberInfo.user }, `${userDefaultPopulate}`);
    const inviteeName = `${current.user.profile.firstName} ${current.user.profile.lastName}`;
    const invitationTo = `${userDetails.profile.firstName} ${userDetails.profile.lastName}`;
    const taskData: any = {
      'type': 'NOTIFICATION',
      'name': `${invitationTo} added to project ${projectDetails.name}`,
      'service': environment.service._id,
      'description': `${inviteeName} has added ${invitationTo} to project ${projectDetails.name}`,
      'createdBy': current.user._id,
      'project': projectDetails._id,
      'organization': current.organization._id,
      'startDate': new Date()
    };
    const taskCreated = await this.tasksApi.create(taskData, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return taskCreated;
  }

  async orgCreateTask(invite: any, projectName: string, current: any) {
    const orgDetails: any = await OrganizationSchema.findOne({ '_id': invite.organization._id }, `${organizationPopulateDefaults}`);
    const action = {
      name: 'Review',
      redirect: `/project-manager/project-invitation/${invite._id}`,
      referenceId: (invite.project && invite.project._id || invite.project),
      data: {
        type: 'Redirect'
      }
    };
    const taskData: any = {
      'type': 'NOTIFICATION',
      'name': `${orgDetails.name} is invited to project ${projectName}`,
      'service': environment.service._id,
      'description': `${current.organization.name} has invited ${orgDetails.name} to project ${projectName}`,
      'createdBy': current.user._id,
      'organization': orgDetails && orgDetails._id,
      'project': invite.project && invite.project._id || invite.project,
      'startDate': new Date(),
      'action': action
    };
    const taskCreated = await this.tasksApi.create(taskData, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return taskCreated;
  }

  createTaskNotification(task: any, current: Current, oldTask?: any) {
    const oldAssignees = oldTask ? oldTask.orchestratorTask.assigned : [];
    const newAssignees = task.orchestratorTask.assigned.filter((assignee: any) => !(_.find(oldAssignees, assigneeId => assigneeId.toString() == assignee._id.toString())));
    if (!newAssignees.length) return;
    const newAssigneesIds = newAssignees.map((a: any) => a._id);
    const notification = {
      name: `${task.orchestratorTask.name} assigned`,
      organization: current.organization._id,
      createdBy: current.user._id,
      referenceId: task.orchestratorTask._id,
      assignedTo: newAssigneesIds,
      project: task.project ? task.project : undefined,
      description: `${current.user.profile.firstName} ${current.user.profile.lastName} assigned the task "${task.orchestratorTask.name}" to you.`,
      redirect: `/project-manager/projects/${task.project}/boards/${task.board}?task=${task.reference}`
    };
    this.createNotification(notification, current);
  }

  createTaskNotificationCommentReply(task: ProjectTask, current: Current, createdComment: Comment, parentComment: Comment) {

    // Do not create notification if the user replies to his/her own comment
    if (parentComment.createdBy._id.toString() === current.user._id) {
      return;
    }

    const notification = {
      name: `${task.orchestratorTask.name} new comment`,
      organization: current.organization._id,
      createdBy: current.user._id,
      referenceId: task.orchestratorTask._id,
      assignedTo: [parentComment.createdBy],
      project: task.project ? task.project : undefined,
      description: `${current.user.profile.firstName} ${current.user.profile.lastName} has added a response to your comment (${task.reference}).`,
      redirect: `/project-manager/projects/${task.project}/boards/${task.board}?task=${task.reference}`
    };
    this.createNotification(notification, current);
  }

  async createNotification(notification: any, current: Current, buttonName: string = 'Review', excludeMe: boolean = true) {
    const assignersWithoutMe = notification.assignedTo.filter((a: any) => a.toString() !== current.user._id.toString());
    const assigned = excludeMe ? assignersWithoutMe : notification.assignedTo;

    if (!assigned.length) {
      return;
    }

    const action = {
      name: 'Review',
      redirect: notification.redirect,
      referenceId: notification.referenceId,
      data: {
        type: 'Redirect',
        assignedTo: assigned,
        label: buttonName
      }
    };
    const taskData: any = {
      type: 'NOTIFICATION',
      name: notification.name,
      service: environment.service._id,
      assigned,
      description: notification.description,
      createdBy: notification.createdBy,
      organization: notification.organization,
      action: action,
    };

    if (notification.project) { taskData.project = notification.project; }
    this.tasksApi.create(taskData, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
  }

  createNotificationStageTaskMoved(task: ProjectTask, stageName: string, current: Current, assigners: string[], taskIn: boolean) {
    const buttonName = 'View task';
    const name = taskIn ? `New task on column` : `Task moved from column`;
    const description = taskIn ? `There is a new task: '${task.orchestratorTask.name}' in '${stageName}' column in '${task.project.name}` :
                                 `Task '${task.orchestratorTask.name}' has been moved from '${stageName}' column in '${task.project.name}`;
    const notification = {
      name,
      organization: current.organization._id,
      createdBy: current.user._id,
      referenceId: task._id,
      assignedTo: assigners,
      project: task.project ? task.project : undefined,
      description,
      redirect: `/project-manager/projects/${task.project._id}/boards/${task.board._id}?task=${task.reference}`
    };

    this.createNotification(notification, current, buttonName);
  }

  createNotificationTagUserInTask(body: TaskNotify, current: Current) {
    const { task, users, message } = body;
    const buttonName = 'View task';
    const name = 'You have been mentioned';
    const description = message ? `User ${current.user.profile.firstName} ${current.user.profile.lastName} tagged you in a comment to the task ${task.orchestratorTask.name} in ${task.project.name}: '${message}'.` :
                                  `User ${current.user.profile.firstName} ${current.user.profile.lastName} tagged you in a description to the task ${task.orchestratorTask.name} in ${task.project.name}.`;
    const notification = {
      name,
      organization: current.organization._id,
      createdBy: current.user._id,
      referenceId: task._id,
      assignedTo: users,
      project: task.project._id || task.project,
      description,
      redirect: `/project-manager/projects/${task.project._id}/boards/${task.board._id || task.board}?task=${task.reference}`
    };

    this.createNotification(notification, current, buttonName);
  }

  async createNotificationOnAcceptOrReject(invite: any, current: any) {
    const orgDetails: any = await OrganizationSchema.findOne({ '_id': invite.organization }, `${organizationPopulateDefaults}`);
    const taskData: any = {
      'type': 'NOTIFICATION',
      'name': `${orgDetails.name} has ${invite.status} invitation to project ${invite.project.name}`,
      'service': environment.service._id,
      'description': `${orgDetails.name} has ${invite.status} invitation to project ${invite.project.name}`,
      'createdBy': current.user._id,
      'organization': invite.invitedBy._id,
      'project': invite.project && invite.project._id || invite.project,
      'startDate': new Date(),
      'action': { referenceId: (invite.project && invite.project._id || invite.project) }
    };
    const taskCreated = await this.tasksApi.create(taskData, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    return taskCreated;
  }

  async checkAndDeleteTaskNotification(oldTaskData: any, newTaskData: any, current: Current) {
    const oldAssignees = oldTaskData.orchestratorTask.assigned ? oldTaskData.orchestratorTask.assigned.map((assignee: any) => assignee._id.toString()) : [];

    if (oldAssignees.length == 0) { return; }
    const newAssignees = newTaskData.orchestratorTask.assigned ? newTaskData.orchestratorTask.assigned.map((assignee: any) => assignee._id.toString()) : [];
    const deletedAssignees = _.difference(oldAssignees, newAssignees);
    if (deletedAssignees.length == 0) { return; }
    try {
      await this.tasksApi.removeMany(oldTaskData.orchestratorTask._id.toString(), deletedAssignees.join(','), { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    } catch (error) {
      logger.error('[DELETING TASK ASSIGNEE NOTIFICATION]', error);
    }
    return;
  }

}

