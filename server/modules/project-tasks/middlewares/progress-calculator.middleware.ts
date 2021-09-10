import { ExpressMiddlewareInterface } from 'routing-controllers';
import { Middleware } from 'routing-controllers';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ProjectTaskSchema } from '../../project-tasks/project-task.model';
import { BoardSchema, Board, BoardType, Stage, State } from '../../boards/board.model';
import * as _ from 'lodash';
import { ProjectSchema } from '../../projects/project.model';
import { logger } from '@aitheon/core-server';

export class ProgressCalculatorMiddleware implements ExpressMiddlewareInterface {

  async use(request: Request, response: Response, next?: (err?: any) => any): Promise<any> {
    if (!response.locals.projectId) {
      return next();
    }
    try {
      const projectId = response.locals.projectId.toString();
      const progress = await this.getProjectProgress(projectId);
      await ProjectSchema.updateOne({_id: projectId}, {
        $set: {progress: progress}
      });
    } catch (err) {
      logger.error('[ProgressCalculatorMiddleware]: could not calculate progress', err);
    }
    next();
  }


  private async getProjectProgress(projectId: string) {
    const boards: Board[] = await BoardSchema.find({ project: projectId }).lean();
    const issueBoardIndex = boards.findIndex(b => b.type === BoardType.ISSUE);
    const issueBoard = boards[issueBoardIndex];
    boards.splice(issueBoardIndex, 1);
    // tslint:disable-next-line: no-null-keyword
    const stageGroupedTasks = await ProjectTaskSchema.aggregate([{$match: {project: new ObjectId(projectId)}}, { $group: { _id: '$stage', count: { $sum: 1 } } }]);
    const allStages = boards.map(b => b.stages).reduce((prev, current) => prev.concat(current));
    const taskStats = this.calculateProgress(stageGroupedTasks, allStages, issueBoard.stages);
    return taskStats;
  }

  private calculateProgress(stageGroupedTasks: { _id: string, count: number, state?: string }[], stages: Stage[], issueStages: Stage[] = []) {

    const progress = {
      toDo: 0,
      inProgress: 0,
      done: 0,
      issues: 0
    };
    for (const task of stageGroupedTasks) {
      let issueStage = false;
      let stage;
      stage = stages.find(s => s._id.toString() === task._id.toString());
      if (!stage) {
        stage = issueStages.find(s => s._id.toString() === task._id.toString());
        issueStage = true;
      }
      if (!stage || stage.state === State.BACKLOG) {
        continue;
      }
      switch (stage.state) {
        case State.TO_DO:
          if (issueStage) {
            progress.issues += task.count;
            break;
          }
          progress.toDo += task.count;
          break;
        case State.IN_PROGRESS:
          if (issueStage) {
            progress.issues += task.count;
            break;
          }
          progress.inProgress += task.count;
          break;
        case State.DONE:
          if (issueStage) {
            break;
          }
          progress.done += task.count;
          break;
      }
    }
    // const total = progress.toDo + progress.done + progress.inProgress + progress.issues;
    // progress.toDo = (progress.toDo / total) * 100;
    // progress.done = (progress.done / total) * 100;
    // progress.inProgress = (progress.inProgress / total) * 100;
    // progress.issues = (progress.issues / total) * 100;

    return progress;
  }

}
