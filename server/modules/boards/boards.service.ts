import Container, { Service, Inject } from 'typedi';
import { BoardSchema, Board, Stage } from './board.model';
import { ObjectId } from 'mongodb';
import { SubscriptionSchema, SubscriptionType, Subscription } from '../subscriptions/subscription.model';


@Service()
export class BoardsService {

  async update(boardId: string, board: Board): Promise<Board> {
    return await BoardSchema.findByIdAndUpdate(boardId, board, { new: true });
  }

  async findByProjectId(projectId: string): Promise<Board[]> {
    return await BoardSchema.find({ project: projectId });
  }

  async findById(boardId: string): Promise<Board> {
    return await BoardSchema.findById(boardId);
  }

  async findByIdWithStageSubscriptions(boardId: string, userId: string): Promise<Board> {
    const board = <Board>(await BoardSchema.findById(boardId).lean());
    const stages = await this.addStagesSubscriptions(board.stages, userId);
    return {
      ...board,
      stages
    };
  }

  async addStagesSubscriptions(stages: Stage[], userId: string): Promise<Stage[]> {
    return await Promise.all(stages.map(async (stage: any) => {
      const query = {
        type: SubscriptionType.STAGE,
        reference: stage._id,
        users: {
          $elemMatch: { $eq: userId }
        }
      };
      const subscription = await SubscriptionSchema.findOne(query).lean() as Subscription;
      return {
        ...stage,
        isSubscribed: !!subscription
      };
    }));
  }

  async listBoards(boards: string[]): Promise<Board[]> {
    const boardsIds = boards.map(b => new ObjectId(b));
    return await BoardSchema.find({ _id: { $in: boardsIds }});
  }



}
