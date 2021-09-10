import { Get, Post, Delete, Put, Body, Param, Res, Req, JsonController, Authorized, CurrentUser, QueryParam } from 'routing-controllers';
import { Inject, Container } from 'typedi';
import { Board, BoardSchema, BoardType } from './board.model';
import { Request, Response } from 'express';
import { Current, logger } from '@aitheon/core-server';
import { ObjectId } from 'bson';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { BoardsService } from './boards.service';
import { connection } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';



@Authorized()
@JsonController('/api/boards')
export class BoardsController {

  @Inject()
  boardsService: BoardsService;


  @Inject()
  projectService: ProjectsService;


  @Put('/:boardId')
  @OpenAPI({ description: 'Update board by id', operationId: 'update' })
  async update(@CurrentUser() current: Current, @Param('boardId') boardId: string, @Body() board: Board, @Res() response: Response) {
    try {
      const result = await this.boardsService.update(boardId, board);
      return response.json(result);
    } catch (err) {
      logger.error('[update board by id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/project/:projectId')
  @OpenAPI({ summary: 'Get boards by project id', operationId: 'getByProjectId' })
  @ResponseSchema(Board, { isArray: true })
  async getBoardByProjectId(@CurrentUser() current: Current, @Param('projectId') projectId: string, @Res() response: Response) {
    try {
      const result = await this.boardsService.findByProjectId(projectId);
      const issueBoardIndex = result.findIndex(b => b.type.toString() === BoardType.ISSUE);

      // Quick fixes
      if (issueBoardIndex != -1) {
       const project = await this.projectService.findById(projectId);
       if (!project.issueBoardEnabled) {
        result.splice(issueBoardIndex, 1);
       }
      }
      return response.json(result);
    } catch (err) {
      logger.error('[list boards by project id]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


  @Get('/board/:boardId')
  @OpenAPI({ summary: 'Get Board By Id', operationId: 'getById' })
  @ResponseSchema(Board)
  async getBoardById(@CurrentUser() current: Current, @Param('boardId') boardId: string, @Res() response: Response) {
    try {
      const board = await this.boardsService.findById(boardId);
      return response.json(board);
    } catch (err) {
      logger.error('[getBoardById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Get('/board/:boardId/stages/subscriptions')
  @OpenAPI({ summary: 'Check Board stages subscriptions', operationId: 'checkStageSubscriptions' })
  @ResponseSchema(Board)
  async checkStageSubscriptions(@CurrentUser() current: Current, @Param('boardId') boardId: string, @Res() response: Response) {
    try {
      const board = await this.boardsService.findByIdWithStageSubscriptions(boardId, current.user._id);

      return response.json(board);
    } catch (err) {
      logger.error('[getBoardById]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }

  @Post('/list')
  @OpenAPI({ description: 'List boards by ids', operationId: 'listBoards' })
  async listBoards(@CurrentUser() current: Current, @Body() body: { boards: string[] }, @Res() response: Response) {
    try {
      const { boards } = body;
      const result = await this.boardsService.listBoards(boards);
      return response.json(result);
    } catch (err) {
      logger.error('[list boards by ids]', err);
      return response.status(422).json({ message: err.message || err });
    }
  }


}
