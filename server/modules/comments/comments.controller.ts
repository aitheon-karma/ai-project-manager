import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject } from 'typedi';
import { Comment } from './comment.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { CommentsService } from './comments.service';
import { ProjectTasksService } from '../project-tasks/project-tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { SharedService } from '../shared/shared.service';
import { PushNotificationsService, PM_PUSH_ACTIONS } from '../shared/push-notifications.service';

@Authorized()
@JsonController('/api/comments')
export class CommentsController {

  @Inject()
  commentsService: CommentsService;

  @Inject()
  taskService: ProjectTasksService;

  @Inject()
  projectService: ProjectsService;

  @Inject()
  sharedService: SharedService;

  @Inject()
  pushNotificationsService: PushNotificationsService;


  @Get('/task/:taskId')
  @OpenAPI({ summary: 'List comments', operationId: 'list' })
  @ResponseSchema(Comment, { isArray: true })
  async list(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('taskId') taskId: string) {
    try {
      const task = await this.taskService.findById(taskId);
      if (!await this.projectService.hasProjectAccess(current, task.project.toString(), true)) {
        return response.status(403).send({message: 'Not allowed'});
      }
      const comments = await this.commentsService.listByTask(taskId);
      return response.json(comments);
    } catch (err) {
      logger.error('[CommentsController.list]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Post('/task/:taskId')
  @OpenAPI({ summary: 'Create comment', operationId: 'create' })
  @ResponseSchema(Comment)
  async create(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('taskId') taskId: string, @Body() comment: Comment) {
    try {
      const task = await this.taskService.findById(taskId);
      if (!await this.projectService.hasProjectAccess(current, task.project.toString(), true)) {
        return response.status(403).send({message: 'Not allowed'});
      }
      let parentComment;
      if (comment.parent) {
        parentComment = await this.commentsService.findById(comment.parent);
        if (typeof parentComment === 'undefined' || parentComment === null) {
          return response.status(404).send({ message: 'Parent comment not found' });
        }
        if (typeof parentComment.parent !== 'undefined' && parentComment.parent !== null) {
          return response.status(400).send({ message: 'Attempt to exceed subcomment depth limit' });
        }

      }
      comment.task = taskId;
      comment.createdBy = current.user._id;
      const createdComment = await this.commentsService.create(comment, current.organization._id);
      if (comment.parent && parentComment) {
        this.sharedService.createTaskNotificationCommentReply(task, current, createdComment as Comment, parentComment);
        const notification = {
          title: 'You have new reply to your comment',
          body: `${current.user.profile.firstName} ${current.user.profile.lastName} replied to your comment to task "${task.orchestratorTask.name}"`,
          // tag: taskId,
          data: {
            url: `https://${current.organization.domain + '.' || ''}${process.env.DOMAIN || 'dev.aitheon.com'}/project-manager/projects/${task.project.toString()}/boards/${task.board.toString()}?task=${task.reference}`
          }
        } as Notification;
        const users = [parentComment.createdBy._id.toString()];
        this.pushNotificationsService.sendPushNotification(notification, users, current, PM_PUSH_ACTIONS.COMMENT_REPLY);
      }
      return response.json(createdComment);
    } catch (err) {
      logger.error('[CommentsController.create]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Put('/task/:taskId/:commentId')
  @OpenAPI({ summary: 'Update a comment', operationId: 'update' })
  @ResponseSchema(Comment)
  async update(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('taskId') taskId: string,
  @Param('commentId') commentId: string , @Body() comment: Comment) {
    try {
      const task = await this.taskService.findById(taskId);
      if (!await this.projectService.hasProjectAccess(current, task.project.toString(), true)) {
        return response.status(403).send({message: 'Not allowed'});
      }
      comment.task = taskId;
      const comments = await this.commentsService.update(commentId, comment);
      return response.json(comments);
    } catch (err) {
      logger.error('[CommentsController.update]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Delete('/task/:taskId/:commentId')
  @OpenAPI({ summary: 'Delete a comment', operationId: 'delete' })
  @ResponseSchema(Comment)
  async delete(@CurrentUser() current: Current, @Res() response: Response, @Req() request: Request, @Param('taskId') taskId: string,
   @Body() comment: Comment,  @Param('commentId') commentId: string) {
    try {
      const task = await this.taskService.findById(taskId);
      if (!await this.projectService.hasProjectAccess(current, task.project.toString(), true)) {
        return response.status(403).send({message: 'Not allowed'});
      }
      comment.task = taskId;
      const comments = await this.commentsService.delete(commentId);
      return response.json(comments);
    } catch (err) {
      logger.error('[CommentsController.delete]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


}
