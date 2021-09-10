import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam, QueryParams, UseAfter, UseBefore } from 'routing-controllers';
import { Inject } from 'typedi';
import { ProjectTask, TaskNotify, ProjectTasksFilter } from './project-task.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { ProjectTasksService, FilterParameters } from './project-tasks.service';
import { TasksApi, Task } from '@aitheon/orchestrator-server';
import { ProjectsService } from '../projects/projects.service';
import * as _ from 'lodash';
import { environment } from '../../environment';
import { ProgressCalculatorMiddleware } from './middlewares/progress-calculator.middleware';
import { State } from '../../modules/boards/board.model';
import { EpicsService } from '../epics/epics.service';
import { BoardsService } from '../boards/boards.service';
import { SharedService } from '../shared/shared.service';
import { PushNotificationsService, PM_PUSH_ACTIONS } from '../shared/push-notifications.service';

const forbiddenResponse = { message: 'Forbidden' };

@Authorized()
@JsonController('/api/tasks')
export class ProjectTasksController {

  @Inject()
  projectTaskService: ProjectTasksService;

  @Inject()
  boardService: BoardsService;

  @Inject()
  sharedService: SharedService;

  @Inject()
  epicsService: EpicsService;

  @Inject()
  projectService: ProjectsService;

  @Inject()
  pushNotificationsService: PushNotificationsService;

  tasksApi: TasksApi;

  constructor() {
    this.tasksApi = new TasksApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/orchestrator`);
  }

  @Get('/projects/:projectId')
  @OpenAPI({ summary: 'List project tasks by project', operationId: 'list' })
  @ResponseSchema(ProjectTask, { isArray: true })
  async listByProject(@CurrentUser() current: Current, @Param('projectId') projectId: string, @Res() response: Response, @Req() request: Request) {
    try {

      const hasAccess = await this.projectService.hasProjectAccess(current, projectId);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }

      const tasks = await this.projectTaskService.listByProject(projectId);
      return response.json(tasks);
    } catch (err) {
      logger.error('[list all project tasks]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/projects/:projectId/orchestrator/:orchestratorTaskId')
  @OpenAPI({ summary: 'List project tasks by project', operationId: 'findByOrchestratorTask' })
  @ResponseSchema(ProjectTask, { isArray: false })
  async findByOrchestratorTask(@CurrentUser() current: Current, @Param('projectId') projectId: string,
      @Param('orchestratorTaskId') orchestratorTaskId: string, @Res() response: Response, @Req() request: Request) {
    try {
      const hasAccess = await this.projectService.hasProjectAccess(current, projectId);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      const task = await this.projectTaskService.getByOrchestratorTask(orchestratorTaskId);
      return response.json(task);
    } catch (err) {
      logger.error('[ProjectTasksController.findByOrchestratorTasks]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }



  @Get('/projects/:projectId/board/:boardId')
  @OpenAPI({ summary: 'List project tasks by project', operationId: 'listByBoard', state: { 'name': 'state filter', 'in': 'query', 'description': 'filter tasks by state', 'schema': { 'type': State } } })
  @ResponseSchema(ProjectTask, { isArray: true })
  async listByBoard(@CurrentUser() current: Current,
    @Param('boardId') boardId: string,
    @Param('projectId') projectId: string,
    @QueryParam('countComments') countComments: boolean,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParams() filters: FilterParameters) {
    try {
      const hasAccess = await this.projectService.hasProjectAccess(current, projectId);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      let tasks = [];
      if (filters) {
        tasks = await this.projectTaskService.listByBoardWithFilters(projectId, boardId, filters);
      } else {
        tasks = await this.projectTaskService.listByBoard(projectId, boardId);
      }

      return response.json(tasks);
    } catch (err) {
      logger.error('[listByBoard]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }




  @Post('/projects/:projectId')
  @OpenAPI({ summary: 'Create project tasks', operationId: 'create' })
  @UseAfter(ProgressCalculatorMiddleware)
  @ResponseSchema(ProjectTask)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any, @Param('projectId') projectId: string) {
    try {

      const hasAccess = await this.projectService.hasProjectAccess(current, projectId);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      const orchestratorTask = body.orchestratorTask;
      orchestratorTask.service = environment.service._id;
      orchestratorTask.project = body.project || projectId;
      orchestratorTask.organization = current.organization._id;
      const task = _.omit(body, 'orchestratorTask') as ProjectTask;
      task.project = projectId;
      const lowestTask = await this.projectTaskService.getLowestTask(projectId, body.stage);
      const taskResponse = await this.tasksApi.create(orchestratorTask, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
      task.orchestratorTask = taskResponse.body._id;
      task.order = lowestTask ? lowestTask.order + 1 : 1;
      if (task.epic) {
        task.epicOrder = await this.projectTaskService.getEpicOrder(task.epic, orchestratorTask.state);
      }
      const result = await this.projectTaskService.create(task, current.organization._id);
      // needed for middleware
      response.locals.projectId = projectId;
      if ((!result.orchestratorTask.assigned) && (result.orchestratorTask.assigned.length === 0)) { return response.json(result); }
      this.sharedService.createTaskNotification(result, current);
      this.projectTaskService.notifyStageChanged(result._id, current, result.stage._id);
      return response.json(result);
    } catch (err) {
      logger.error('[create project task]', err.message);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Put('/projects/:projectId/:referenceId')
  @OpenAPI({ summary: 'Update Project task', operationId: 'update' })
  @UseAfter(ProgressCalculatorMiddleware)
  @ResponseSchema(ProjectTask)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any, @Param('projectId') projectId: string, @Param('referenceId') reference: string) {
    try {
      const hasAccess = await this.projectService.hasProjectAccess(current, projectId);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }

      const task = await this.projectTaskService.findByReference(reference, projectId);

      if (!task) {
        return response.status(404).send({ message: 'Task not found' });
      }

      const oldTaskData = await this.projectTaskService.findById(task._id);
      const orchestratorTask = body.orchestratorTask;
      orchestratorTask.service = environment.service._id;
      orchestratorTask.project = projectId;
      orchestratorTask._id = task.orchestratorTask._id.toString();
      const taskToUpdate = _.omit(body, 'orchestratorTask', 'reference') as ProjectTask;
      taskToUpdate.project = projectId;
      let stageChanged = false;
      let epicChanged = false;

      if (body.stage.toString() !== task.stage.toString()) {
        taskToUpdate.order = await this.projectTaskService.getTaskOrder(projectId, task.stage);
        this.projectTaskService.notifyStageChanged(task._id, current, body.stage, task.stage);
        stageChanged = true;
      }

      if (body.epic && task.epic && (body.epic._id != task.epic._id)) {
        taskToUpdate.epicOrder = await this.projectTaskService.getEpicOrder(body.epic, orchestratorTask.state, task._id);
        epicChanged = true;
      }

      const taskResponse = await this.tasksApi.update(task.orchestratorTask._id.toString(), orchestratorTask, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
      const result = await this.projectTaskService.update(task._id.toString(), taskToUpdate, current, stageChanged, epicChanged);
      // needed for middleware
      response.locals.projectId = projectId;
      this.sharedService.checkAndDeleteTaskNotification(oldTaskData, result, current);
      if ((!result.orchestratorTask.assigned) && (result.orchestratorTask.assigned.length === 0)) { return response.json(result.orchestratorTask); }
      oldTaskData.orchestratorTask.assigned = (oldTaskData.orchestratorTask.assigned && oldTaskData.orchestratorTask.assigned.length !== 0) ? oldTaskData.orchestratorTask.assigned.map((assignee: any) => assignee._id) : [];
      this.sharedService.createTaskNotification(result, current, oldTaskData);
      const oldAssignees = oldTaskData ? oldTaskData.orchestratorTask.assigned : [];
      const newAssignees = result.orchestratorTask.assigned.filter((assignee: any) => !(_.find(oldAssignees, assigneeId => assigneeId.toString() == assignee._id.toString())));
      if (newAssignees.length) {
        const newAssigneesIds = newAssignees.map((a: any) => a._id);
        const notification = {
          title: `You've got a new task!`,
          body: `${current.user.profile.firstName} ${current.user.profile.lastName} assigned task "${result.orchestratorTask.name}" to you.`,
          // tag: result._id,
          data: {
            url: `https://${current.organization.domain + '.' || ''}${process.env.DOMAIN || 'dev.aitheon.com'}/project-manager/projects/${projectId}/boards/${task.board.toString()}?task=${task.reference}`
          }
        } as Notification;
        this.pushNotificationsService.sendPushNotification(notification, newAssigneesIds, current, PM_PUSH_ACTIONS.TASK_ASSIGNED);
      }
      // TO_DO: When subscribe to task flow will be implemented
      // const notification = {
      //   title: 'New updates to the task',
      //   body: `${current.user.profile.firstName} ${current.user.profile.lastName} updated the task "${result.orchestratorTask.name}"`,
      //   tag: result._id
      // } as Notification;
      // const users = body.users;
      // this.pushNotificationsService.sendPushNotification(notification, users, current);
      return response.json(result);
    } catch (err) {
      logger.error('[update task by reference]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }
  @Put('/project/done/:orchestratorTaskId')
  @OpenAPI({ summary: 'Mark task as done ', operationId: 'markAsDone' })
  async markAsDone(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('orchestratorTaskId') orchestratorTaskId: string, @Body() body: any) {
    const task = await this.projectTaskService.findByOrchestratorTaskId(orchestratorTaskId);
    if (!task) { return response.status(200).send(); }
    const board = await this.boardService.findById(task.board);
    const doneStage = board.stages.find(stage => stage.state === State.DONE && stage.default);
    const result = await this.projectTaskService.update(task._id, { stage: doneStage._id }, current);
    return response.status(200).json(result);
  }

  @Post('/search')
  @OpenAPI({ summary: 'Search project tasks', operationId: 'search' })
  @ResponseSchema(ProjectTask, { isArray: true })
  async search(@CurrentUser() current: Current, @QueryParam('countComments') countComments: boolean, @Res() response: Response, @Req() request: Request, @Body() filter: ProjectTasksFilter) {
    try {
      let hasAccess = true;
      if (filter.epic) {
        hasAccess = await this.epicsService.hasEpicAccess(filter.epic, current.organization._id);
      } else {
        hasAccess = await this.projectService.hasProjectAccess(current, filter.project);
      }
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      filter.organization = current.organization._id;
      const result = await this.projectTaskService.advancedSearch(filter, countComments);
      return response.json(result);
    } catch (err) {
      logger.error('[list all project tasks by search]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/projects/:projectId/:reference')
  @OpenAPI({ summary: 'findByReference', operationId: 'findByReference' })
  @ResponseSchema(ProjectTask)
  async findByReference(@CurrentUser() current: Current,
    @Param('projectId') projectId: string,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('readOnly') readOnly: boolean,
    @Param('reference') reference: string) {
    try {
      const hasAccess = await this.projectService.hasProjectAccess(current, projectId, readOnly);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      let task = await this.projectTaskService.findByReference(reference, projectId);
      if (!task) {
        return response.status(404).send({ message: 'Task not found' });
      }

      if (readOnly) {
        task = task.toObject();
        const writeAccess = await this.projectService.hasProjectAccess(current, projectId);
        task.readOnly = !writeAccess;
      }
      return response.json(task);
    } catch (err) {
      logger.error('[find task by reference]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/global/owner/:reference')
  @OpenAPI({ summary: 'find By Reference in owner organization', operationId: 'findByReferenceInOwner' })
  @ResponseSchema(ProjectTask)
  async findByReferenceInOwner(@CurrentUser() current: Current,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('readOnly') readOnly: boolean,
    @Param('reference') reference: string) {
    try {
      let task = await this.projectTaskService.findByReferenceInOwner(reference, current.organization._id);
      if (!task) {
        return response.status(404).send({ message: 'Task not found' });
      }

      const hasAccess = await this.projectService.hasProjectAccess(current, task.project, readOnly);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }

      if (readOnly) {
        task = task;
        const writeAccess = await this.projectService.hasProjectAccess(current, task.project);
        task.readOnly = !writeAccess;
      }
      return response.json(task);
    } catch (err) {
      logger.error('[find task by reference]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/projects/:projectId/children/:parentId')
  @OpenAPI({ summary: 'findByReference', operationId: 'listByParent' })
  @ResponseSchema(ProjectTask, { isArray: true })
  async findByParent(@CurrentUser() current: Current,
    @Param('projectId') projectId: string,
    @Res() response: Response,
    @Req() request: Request,
    @QueryParam('readOnly') readOnly: boolean,
     @QueryParam('countComments') countComments: boolean,
    @Param('parentId') parentId: string) {
    try {
      const hasAccess = await this.projectService.hasProjectAccess(current, projectId, readOnly);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }
      const tasks = await this.projectTaskService.findByParent(parentId, true);
      return response.json(tasks);
    } catch (err) {
      logger.error('[find task by parent]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/reference/:taskId')
  @OpenAPI({ summary: 'findByReference', operationId: 'getReference' })
  async getReferenceById(@CurrentUser() current: Current, @Param('taskId') taskId: string, @Res() response: Response) {
    const reference = await this.projectTaskService.findReference(taskId);
    return response.json(reference);
  }

  @Post('/stage/reorder/:projectId')
  @OpenAPI({ summary: 'Reorder tasks', operationId: 'reorderTasks' })
  @UseAfter(ProgressCalculatorMiddleware)
  async reorderTasks(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any, @Param('projectId') projectId: string) {
    try {
      await this.projectTaskService.reorderTaskInStage(body.currentStageTasks);

      if (body.previousStageTasks) {
        await this.projectTaskService.updateOrchestratorTask(body.draggedTask.orchestratorTask._id, { state: body.draggedTask.stage.state });
        await this.projectTaskService.reorderTaskInStage(body.previousStageTasks);
        this.projectTaskService.notifyStageChanged(body.draggedTask._id, current, body.draggedTask.stage._id, body.previousStage);
      }

      response.locals.projectId = projectId;
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[reorder project tasks]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/notify')
  @OpenAPI({ summary: 'Notify users about action with task', operationId: 'notify' })
  @UseAfter(ProgressCalculatorMiddleware)
  async notify(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: TaskNotify) {
    try {
      if (body.task.project) {
        const project = await this.projectService.findById(body.task.project);
        body.task.project = project;
      }
      const notification = {
        title: body.message ? 'You were mentioned in a comment' :
                              `You were tagged in a task`,
        body: body.message ? `${current.user.profile.firstName} ${current.user.profile.lastName} tagged you in a comment to task "${body.task.orchestratorTask.name}"` :
                             `${current.user.profile.firstName} ${current.user.profile.lastName} tagged you in a task "${body.task.orchestratorTask.name}"`,
        // tag: body.task._id,
        data: {
          url: `https://${current.organization.domain + '.' || ''}${process.env.DOMAIN || 'dev.aitheon.com'}/project-manager/projects/${body.task.project._id.toString()}/boards/${body.task.board.toString()}?task=${body.task.reference}`
        }
      } as Notification;
      const users = body.users;
      const action = body.message ? PM_PUSH_ACTIONS.TAGGED_IN_COMMENT : PM_PUSH_ACTIONS.TAGGED_IN_TASK;
      this.pushNotificationsService.sendPushNotification(notification, users, current, action);
      await this.sharedService.createNotificationTagUserInTask(body, current);
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[notify about project tasks]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/epic/reorder')
  @OpenAPI({ summary: 'Reorder tasks in epic', operationId: 'reorderTasksInEpic' })
  async reorderTasksInEpic(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Body() body: any) {
    try {
      await this.projectTaskService.reorderTaskInEpic(body.tasks);
      return response.sendStatus(204);
    } catch (err) {
      logger.error('[reorder project tasks in epic]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/:projectTaskId')
  @OpenAPI({ summary: 'Delete task and all of its related data', operationId: 'deleteTask' })
  @UseAfter(ProgressCalculatorMiddleware)
  async deleteTask(@Param('projectTaskId') projectTaskId: string, @CurrentUser() current: Current, @Res() response: Response) {
    try {

      const projectTask = await this.projectTaskService.findById(projectTaskId);
      const hasAccess = await this.projectService.hasProjectAccess(current, projectTask.project && projectTask.project._id || projectTask.project);
      if (!hasAccess) {
        return response.status(403).send(forbiddenResponse);
      }

      const subTasks = await this.projectTaskService.findByParent(projectTaskId);
      let subTaskIds = _.map(subTasks, (subTask: any) => subTask.orchestratorTask && subTask.orchestratorTask._id);
      subTaskIds.push(projectTask.orchestratorTask && projectTask.orchestratorTask._id || projectTask.orchestratorTask);
      subTaskIds = _.filter(subTaskIds, subTaskId => subTaskId);
      subTaskIds = _.map(subTaskIds, (subTaskId: any) => subTaskId.toString());
      await this.projectTaskService.deleteTaskById(projectTaskId, current.organization._id);

      await this.tasksApi.removeMany(subTaskIds.join(','), undefined, { headers: { 'Authorization': `JWT ${current.token}`, 'organization-id': current.organization._id } });
      response.locals.projectId = projectTask.project.toString();
      return response.sendStatus(204);

    } catch (err) {
      logger.error('[delete project task]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


}
