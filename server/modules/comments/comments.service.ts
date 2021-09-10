import Container, { Service, Inject } from 'typedi';
import { Comment, CommentSchema } from './comment.model';
import { userDefaultPopulate } from '../users/user.model';
import { GraphOutputsService } from '../core/graph-outputs.service';
import { DocumentSchema } from '../shared/drive-document.model';
import { ProjectTaskSchema } from '../project-tasks/project-task.model';

@Service()
export class CommentsService {

  private graphService: GraphOutputsService;

  constructor() {
    this.graphService = Container.get(GraphOutputsService);
  }

  async listByTask(taskId: string): Promise<Comment[]> {
    return CommentSchema.find({task: taskId})
    .populate('createdBy', userDefaultPopulate)
    .populate({
      path: 'attachments._id',
      model: DocumentSchema.modelName,
      select: 'thumbnail'
    })
    .sort({createdAt: 1});
  }

  async create(comment: Comment, organization: string) {
    const createdComment = await CommentSchema.create(comment);
    const task = await ProjectTaskSchema.findById(comment.task).lean();
    await this.graphService.commentAdded({organization, comment: createdComment.toObject(), specialReference: task.project });
    if (createdComment.parent) {
      await this.graphService.commentReplied({organization, comment: createdComment.toObject(), specialReference: task.project });
    }
    return this.findById(createdComment._id.toString());
  }

  async update(commentId: string, comment: Comment) {
    return CommentSchema.findByIdAndUpdate({_id: commentId}, comment, {new: true})
      .populate('createdBy', userDefaultPopulate);
  }

  async findById(commentId: string) {
    return CommentSchema.findById({_id: commentId}).populate('createdBy', userDefaultPopulate);
  }


  async delete(taskId: string) {
    return CommentSchema.findOneAndDelete({_id: taskId});
  }

  async commentsCount(taskIds: string[]) {
    // tslint:disable-next-line: no-null-keyword
    const groupByResult = await CommentSchema.aggregate([{$match: { task: { $in: taskIds} } }, { $group: { _id: '$task', count: { $sum: 1 } } }]);
    const objectNotation = groupByResult.reduce((prev, current) => (prev[current._id] = current.count, prev) , {});
    return objectNotation;
  }

}
