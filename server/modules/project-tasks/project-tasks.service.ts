import Container, { Service, Inject } from 'typedi';
import { ProjectTask, ProjectTaskSchema, projectTaskDefaultQuery, IProjectTask, projectDefaultQuery, ProjectTasksFilter } from './project-task.model';
import { ObjectId } from 'mongodb';
import { IsString, IsOptional } from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';
import { taskDefaultPopulate, TaskSchema } from '../tasks/task.model';
import { userDefaultPopulate } from '../users/user.model';
import { BoardSchema, Stage, State } from '../../modules/boards/board.model';
import { TasksApi, Task } from '@aitheon/orchestrator-server';
import { Current, logger } from '@aitheon/core-server';
import { ProjectStatus, ProjectSchema, Project } from '../projects/project.model';
import { CommentsService } from '../comments/comments.service';
import { GraphOutputsService } from '../core/graph-outputs.service';
import { DocumentSchema } from '../shared/drive-document.model';
import { TransporterService, InputService, Transporter } from '@aitheon/transporter';
import { ProjectTask as ProjectTaskSocket } from '../../sockets/ProjectManager/projectTask';
import * as _ from 'lodash';
import { SharedService } from '../shared/shared.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ProjectRole, ProjectAccessType } from '../projects/project-roles/project-roles.model';
import { PushNotificationsService, PM_PUSH_ACTIONS } from '../shared/push-notifications.service';

@JSONSchema({ description: 'Optional query filter parameters' })
export class FilterParameters {
  @IsString()
  @IsOptional()
  state?: State;
}

@Service()
@Transporter()
export class ProjectTasksService extends TransporterService {

  tasksApi: TasksApi;

  @Inject(type => CommentsService)
  private commentsService: CommentsService;

  @Inject(type => GraphOutputsService)
  private graphService: GraphOutputsService;

  @Inject(type => SubscriptionsService)
  private subscriptionsService: SubscriptionsService;

  @Inject()
  sharedService: SharedService;

  @Inject()
  pushNotificationsService: PushNotificationsService;

  constructor() {
    super(Container.get('TransporterBroker'));
    this.tasksApi = new TasksApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/orchestrator`);
  }

  async listByProject(projectId: string): Promise<ProjectTask[]> {
    return await ProjectTaskSchema
      .find({ project: projectId, archived: false })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      });
  }

  async listByBoard(projectId: string, boardId: string, countComments?: boolean): Promise<ProjectTask[]> {
    const tasks = await ProjectTaskSchema
      .find({ project: projectId, board: boardId, archived: false })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      });
    if (countComments) {
      await this.addCommentsCountField(tasks);
    }
    return tasks;
  }

  async listByEpic(epicId: string, archived: boolean): Promise<ProjectTask[]> {
    const tasks = await ProjectTaskSchema.find({ epic: epicId, archived: archived })
      .populate('orchestratorTask', 'name description state')
      .populate('project', 'name');
    return tasks;
  }

  async advancedSearch(filter: ProjectTasksFilter, countComments?: boolean): Promise<ProjectTask[]> {
    const query = {} as any;
    query.$and = [];
    if (filter.organization) {
      query.$and.push({ 'orchestratorTask.organization': new ObjectId(filter.organization) });
    }
    if (filter.project) {
      query.$and.push({ 'project._id': new ObjectId(filter.project) });
    }
    if (filter.projects && Array.isArray(filter.projects) === true && filter.projects.length > 0) {
      query.$and.push({ 'project._id': {$in: filter.projects.map((p: string) => new ObjectId(p))}});
    }
    if (filter.epic) {
      query.$and.push({ 'epic._id': new ObjectId(filter.epic) });
    }
    if (filter.board) {
      query.$and.push({ board: new ObjectId(filter.board) });
    }
    if (filter.searchText) {
      query.$and.push({
        $or: [
          { $or: [
              {'reference': { $regex: filter.searchText, $options: 'i' }},
              {'parent.reference': { $regex: filter.searchText, $options: 'i' }}
            ]
          },
          { 'orchestratorTask.name': { $regex: filter.searchText, $options: 'i' } }
        ]
      });
    }
    if (filter.assignees && filter.assignees.length) {
      const assigned = filter.assignees.map((a: any) => new ObjectId(a));
      query.$and.push({ 'orchestratorTask.assigned': { $elemMatch: { '_id': { $in: assigned } } } });
    }
    if (filter.createdBy && filter.createdBy.length) {
      const createdBy = filter.createdBy.map((a: any) => new ObjectId(a));
      query.$and.push({ 'orchestratorTask.createdBy._id': { $in: createdBy } });
    }
    if (filter.labels && filter.labels.length) {
      const labels = filter.labels.map((a: any) => new ObjectId(a));
      query.$and.push({ 'labels': { $elemMatch: { '_id': { $in: labels } } } });
    }
    if (filter.types && filter.types.length) {
      query.$and.push({ 'orchestratorTask.type': { $in: filter.types } });
    }
    if (filter.priorities && filter.priorities.length) {
      query.$and.push({ 'orchestratorTask.priority': { $in: filter.priorities } });
    }
    if ('archived' in filter) {
      query.$and.push({ 'archived': filter.archived });
    }
    if (filter.status) {
      query.$and.push({ 'orchestratorTask.state': filter.status });
    }
    const sort = filter.sort && Object.keys(filter.sort).length ? filter.sort : { 'createdAt': -1 };
    const aggregates = [
      ...projectTaskDefaultQuery,
      {
        $match: query
      },
      projectDefaultQuery
    ];

    const tasks = await ProjectTaskSchema.aggregate(aggregates).sort(sort).exec();
    if (countComments) {
      await this.addCommentsCountField(tasks);
    }
    return tasks;
  }

  async create(body: any, organization: string): Promise<ProjectTask> {
    const task = await ProjectTaskSchema.create(body);
    const resultResp = await this.findById(task._id.toString());
    const result = resultResp.toObject();
    await this.graphService.taskCreated({ organization, task: result, specialReference: task.project });
    if (result.epic) {
      await this.graphService.epicNewTask({ organization, epic: result.epic });
    }
    return result;
  }

  async update(taskId: string, body: any, current: Current, stageChanged: boolean = false, epicChanged: boolean = false): Promise<ProjectTask> {
    const task = await ProjectTaskSchema.findOneAndUpdate({ _id: taskId }, body, { new: true });
    const resultResp = await this.findById(task._id.toString());
    const result = resultResp.toObject();
    await this.graphService.taskUpdated({ organization: current.organization._id, task: result, specialReference: result.project });
    if (stageChanged) {
      await this.graphService.taskStateChanged({ organization: current.organization._id, task: result, specialReference: result.project });
    }
    if (epicChanged) {
      await this.graphService.epicNewTask({ organization: current.organization._id, epic: result.epic });
    }
    return result;
  }

  async notifyStageChanged(taskId: string, current: Current, newStageId: string, oldStageId: string = '') {
      const task = (await ProjectTaskSchema.findById(taskId).populate('orchestratorTask', '_id name').populate('board').populate('project', '_id name')).toObject();
      this.processStageChangedNotifiers(task, current, newStageId, true);
      if (oldStageId) {
        this.processStageChangedNotifiers(task, current, oldStageId, false);
      }
  }

  async processStageChangedNotifiers(task: ProjectTask, current: Current, stageId: string, isIn: boolean) {
    const stage = task.board.stages.find((stage: Stage) => stage._id.toString() === stageId.toString());
    const subscribers = await this.subscriptionsService.getSubscribersForStage(stageId);
    if (subscribers && subscribers.length) {
      this.sharedService.createNotificationStageTaskMoved(task, stage.name, current, subscribers, isIn);
      const notification = {
        title: isIn ? 'New task in column' : 'Task removed from the column',
        body: isIn ? `New task: "${task.orchestratorTask.name}" has been added to column "${stage.name}"` :
                     `Task "${task.orchestratorTask.name}" has been removed from column "${stage.name}"`,
        // tag: stage._id,
        data: {
          url: `https://${current.organization.domain + '.' || ''}${process.env.DOMAIN || 'dev.aitheon.com'}/project-manager/projects/${task.project._id.toString()}/boards/${task.board._id.toString()}?task=${task.reference}`
        }
      } as Notification;
      this.pushNotificationsService.sendPushNotification(notification, subscribers, current, PM_PUSH_ACTIONS.CHANGE_TASK_COLUMN);
    }
  }

  async removeFromEpic(epicId: string): Promise<any> {
    return await ProjectTaskSchema.updateMany({ epic: epicId }, { $unset: { epic: 1 } });
  }


  async findById(taskId: string): Promise<IProjectTask> {
    return ProjectTaskSchema.findById({ _id: taskId })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      })
      .populate('epic')
      .populate('labels');
  }

  async findByParent(parentId: string, commentsCount: boolean = false): Promise<ProjectTask[]> {
    let tasks = await ProjectTaskSchema.find({ parent: parentId })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      })
      .populate('epic')
      .populate('board')
      .populate('labels');

    if (commentsCount) {
      tasks = await this.addCommentsCountField(tasks, true);
    }

    const result = tasks.map((task: ProjectTask) => {
      const stage = task.board.stages.find((s: Stage) => s._id.toString() === task.stage.toString());
      return {
        ...task,
        stage
      } as ProjectTask;
    });

    return result;
  }

  async getLowestTask(projectId: string, stageId: string): Promise<ProjectTask> {
    const tasks = await ProjectTaskSchema.find({ project: projectId, stage: stageId }).sort({ order: -1 }).limit(1);
    return tasks[0];
  }

  async getLowestEpicTask(epicId: string, state: string): Promise<ProjectTask> {
    const aggregation = [
      {
        $lookup: {
          from: 'orchestrator__tasks',
          localField: 'orchestratorTask',
          foreignField: '_id',
          as: 'orchestratorTask',
        }
      },
      {
        $unwind: {
          path: '$orchestratorTask',
          preserveNullAndEmptyArrays: true
        },
      },
      {
        $match: {
          epic: new ObjectId(epicId),
          'orchestratorTask.state': state
        }
      }
    ];
    const tasks = await ProjectTaskSchema.aggregate(aggregation).sort({ 'epicOrder': -1 }).limit(1);
    return tasks[0];
  }

  async getTaskOrder(projectId: string, stage: string) {
    const lowestTask = await this.getLowestTask(projectId, stage);
    return lowestTask ? lowestTask.order + 1 : 1;
  }

  async getEpicOrder(epicId: string, state: string, taskId: string = '') {
    const lowestTask = await this.getLowestEpicTask(epicId, state);
    if (taskId && taskId.toString() === lowestTask._id.toString()) {
      return lowestTask.epicOrder;
    }
    return lowestTask && lowestTask.epicOrder ? lowestTask.epicOrder + 1 : 1;
  }

  async findByReference(reference: string, project: string) {
    return ProjectTaskSchema.findOne({ reference, project })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'createdBy',
          select: userDefaultPopulate,
        }
      })
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'files._id',
          model: DocumentSchema.modelName,
          select: 'thumbnail'
        }
      })
      .populate('epic')
      .populate('labels');
  }

  async findByReferenceInOwner(reference: string, organizationId: string): Promise<ProjectTask> {
    const projectTasks = await ProjectTaskSchema.find({ reference }).populate('project').lean();
    const result = projectTasks.find((task: ProjectTask) => {
      const project = task.project as Project;
      return project.roles.find((role: ProjectRole) => role.organization.toString() == organizationId.toString() && role.accessType === ProjectAccessType.OWNER);
    });
    return result;
  }

  async listByBoardWithFilters(projectId: string, boardId: string, filters: FilterParameters, countComments?: boolean): Promise<ProjectTask[]> {
    const { state } = filters;
    const query: any = { project: projectId, board: boardId, archived: false };

    const board = await BoardSchema.findOne({ _id: boardId });
    let tasks = await ProjectTaskSchema
      .find(query)
      .populate({
        path: 'orchestratorTask',
        select: taskDefaultPopulate,
        populate: {
          path: 'assigned',
          select: userDefaultPopulate,
        }
      });
    const stages = board.stages.reduce((a: any, s: Stage) => { a[s._id] = s; return a; }, {});
    tasks = tasks.map((t) => {
      t = t.toObject();
      t.stage = stages[t.stage];
      return t;
    });
    if (state) {
      tasks = tasks.filter((t) => (t.stage.state === state));
    }
    return tasks;
  }

  async reorderTaskInStage(tasks: any): Promise<any> {
    tasks.forEach(async (task: ProjectTask, i: number) => {
      await ProjectTaskSchema.findByIdAndUpdate(task._id, { order: i + 1, stage: task.stage });
    });
    return;
  }

  async reorderTaskInEpic(tasks: string[]): Promise<any> {
    tasks.forEach(async (taskId: string, i: number) => {
      await ProjectTaskSchema.findByIdAndUpdate(taskId, { epicOrder: i + 1 });
    });
    return;
  }

  async archiveProjectTasks(projectId: string) {
    return await ProjectTaskSchema.updateMany({ project: projectId }, { archived: true });
  }

  async archiveProjectTasksInEpic(epicId: string, value: boolean = true) {
    return await ProjectTaskSchema.updateMany({ epic: epicId }, { archived: value });
  }

  async unarchiveProjectTasks(projectId: string) {
    return await ProjectTaskSchema.updateMany({ project: projectId }, { archived: false });
  }

  async deleteProjectTasks(projectId: string, current: Current) {
    const projectTasks = await ProjectTaskSchema.find({ project: projectId });

    const orchestratorTaskIds: string = projectTasks.map((projectTask) => projectTask.orchestratorTask).join(',');
    let taskIds: string;
    if (orchestratorTaskIds) {
      taskIds = orchestratorTaskIds + `,${projectId}`;
    } else {
      taskIds = projectId;
    }
    await this.tasksApi.removeMany(taskIds, undefined, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });

    return await ProjectTaskSchema.remove({ project: projectId });
  }


  async findReference(taskId: string) {
    return ProjectTaskSchema.findById({ _id: taskId }, 'reference');
  }

  // Needs Refactor
  async updateOrchestratorTask(taskId: string, orchestratorTask: any) {
    return await TaskSchema.findByIdAndUpdate(taskId, orchestratorTask);
  }

  async findByOrchestratorTaskId(taskId: string): Promise<IProjectTask> {
    return ProjectTaskSchema.findOne({ orchestratorTask: taskId });
  }

  private async addCommentsCountField(tasks: ProjectTask[], subTasks: boolean = false) {
    const commentIds = tasks.map(t => t._id);
    const result = await this.commentsService.commentsCount(commentIds);
    if (!subTasks) {
      tasks.forEach(t => t.commentsCount = (result[t._id] || 0));
    } else {
      return tasks.map((task: any) => {
        return { ...task.toObject(), commentsCount: (result[task._id] || 0)};
      });
    }
  }

  async deleteTaskById(taskId: string, organization: string) {
    const tasks = await ProjectTaskSchema.find({
      $or: [
        { _id: taskId }, // Parent
        { parent: taskId } // Sub task
      ]
    }).populate('orchestratorTask').lean();
    // Delete parent and sub tasks
    await ProjectTaskSchema.deleteMany({
      $or: [
        { _id: taskId }, // Parent
        { parent: taskId } // Sub task
      ]
    });
    await Promise.all(tasks.map(async (task: ProjectTask) => {
      return await this.graphService.taskDeleted({ organization, task, specialReference: task.project });
    }));
    return;
  }

  async getByOrchestratorTask(orchestratorTaskId: string) {
    return ProjectTaskSchema.findOne({orchestratorTask: orchestratorTaskId}, 'board reference stage _id');
  }

  // Finish after transporter to orchestrator
  async createFromNode(data: ProjectTaskSocket) {
    // const orchestratorTask = _.pick(data, ['name', 'description', 'files', 'type', 'priority', 'assigned', 'finishDate', 'state']) as any;
    // orchestratorTask.service = environment.service._id;
    // orchestratorTask.project = data.project;
    // orchestratorTask.organization = data.organization._id || data.organization;
    // const task = _.omit(data, 'orchestratorTask', 'name', 'description', 'files', 'type', 'priority', 'assigned', 'finishDate', 'state');
    // task.project =  data.project;
    // const lowestTask = await this.getLowestTask(data.project, data.stage);
    // const taskResponse = await this.tasksApi.create(orchestratorTask, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
    // task.orchestratorTask = taskResponse.body._id;
    // task.order = lowestTask ? lowestTask.order + 1 : 1;
    // const result = await this.projectTaskService.create(task, current.organization._id);
    // // needed for middleware
    // response.locals.projectId = projectId;
    // if ((!result.orchestratorTask.assigned) && (result.orchestratorTask.assigned.length === 0)) { return response.json(result); }
    // this.sharedService.createTaskNotification(result, current);
    return;
  }




}
