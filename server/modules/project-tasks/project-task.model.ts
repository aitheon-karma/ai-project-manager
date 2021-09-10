import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import '../tasks/task.model';
import { Label } from '../labels/label.model';
import { Type } from 'class-transformer';
import { FileModel } from '../tasks/task.model';
import { SequenceSchema, SequenceType } from '../sequences/sequence.model';
import { logger } from '@aitheon/core-server';
import { BoardSchema, Board, Stage } from '../boards/board.model';

/***
 * Project task Type. Data Transfer object type
 */
@JSONSchema({ description: 'Project task' })
export class ProjectTask {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  @IsOptional()
  reference: string;

  @IsDefined()
  orchestratorTask: any;

  @IsDefined()
  project: any;

  @JSONSchema({
    items: { type: 'object' },
    type: 'array'
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Label)
  labels: Label[];

  @IsNumber()
  @IsOptional()
  order: number;

  @IsNumber()
  @IsOptional()
  epicOrder: number;

  @IsDefined()
  stage: any;

  @IsOptional()
  epic: any;

  @IsDefined()
  board: any;

  @IsBoolean()
  archived: boolean;

  @IsOptional()
  parent: any;

  // only in client
  @IsOptional()
  @IsBoolean()
  readOnly: boolean;

  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;

  // dynamic field, should not be in db
  @IsOptional()
  @IsNumber()
  commentsCount: number;

}

/***
 * Project task Type. Data Transfer object type
 */
@JSONSchema({ description: 'Notify about task body' })
export class TaskNotify {

  @ValidateNested()
  @Type(() => ProjectTask)
  task: ProjectTask;

  @IsArray()
  users: string[];

  @IsOptional()
  @IsString()
  message: string;
}

@JSONSchema({ description: 'Project tasks filter for search' })
export class ProjectTasksFilter {

  @IsString()
  @IsOptional()
  epic: string;

  @IsString()
  @IsOptional()
  project: string;

  @IsString()
  @IsOptional()
  organization: string;

  @IsString()
  @IsOptional()
  board: string;

  @IsString()
  @IsOptional()
  searchText: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsBoolean()
  @IsOptional()
  archived: boolean;

  @IsArray()
  @IsOptional()
  projects: string[];

  @IsArray()
  @IsOptional()
  assignees: string[];

  @IsArray()
  @IsOptional()
  createdBy: string[];

  @IsArray()
  @IsOptional()
  labels: string[];

  @IsArray()
  @IsOptional()
  types: string[];

  @IsArray()
  @IsOptional()
  priorities: string[];

  @IsOptional()
  sort: any;

}


/**
 * Database schema/collection
 */
const projectTaskSchema = new Schema(
  {
    orchestratorTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    labels: [{
      type: Schema.Types.ObjectId,
      ref: 'Label'
    }],
    order: {
      type: Number,
      default: 1,
      min: 1
    },
    epicOrder: {
      type: Number,
      default: 1,
      min: 1
    },
    stage: {
      type: Schema.Types.ObjectId,
      ref: 'Stage',
      required: true
    },
    archived: {
      type: Boolean,
      default: false
    },
    epic: {
      type: Schema.Types.ObjectId,
      ref: 'Epic'
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board'
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'ProjectTask'
    },
    reference: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
    collection: 'project_manager__tasks'
  }
);

export const projectTaskDefaultQuery = [
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
    $lookup: {
      from: 'users',
      localField: 'orchestratorTask.assigned',
      foreignField: '_id',
      as: 'orchestratorTask.assigned',
    }
  },
  {
    $lookup: {
      from: 'project_manager__boards',
      localField: 'board',
      foreignField: '_id',
      as: 'boardObj',
    }
  },
  {
    $unwind: {
      path: '$boardObj',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $addFields: {
      stages: '$boardObj.stages'
    }
  },
  {
    $addFields: {
      stageObj: {
        $filter: {
          input: '$stages',
          as: 'stg',
          cond: { $eq: ['$$stg._id', '$stage']}
        }
      }
    }
  },
  {
    $unwind: {
      path: '$stageObj'
    }
  },
  {
    $lookup: {
      from: 'project_manager__epics',
      localField: 'epic',
      foreignField: '_id',
      as: 'epic',
    }
  },
  {
    $unwind: {
      path: '$epic',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $lookup: {
      from: 'project_manager__labels',
      localField: 'labels',
      foreignField: '_id',
      as: 'labels',
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'orchestratorTask.createdBy',
      foreignField: '_id',
      as: 'orchestratorTask.createdBy',
    }
  },
  {
    $unwind: {
      path: '$orchestratorTask.createdBy',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $lookup: {
      from: 'project_manager__projects',
      localField: 'project',
      foreignField: '_id',
      as: 'project',
    }
  },
  {
    $unwind: {
      path: '$project',
      preserveNullAndEmptyArrays: true
    },
  },
  {
    $lookup: {
      from: 'project_manager__tasks',
      localField: 'parent',
      foreignField: '_id',
      as: 'parent',
    }
  },
  {
    $unwind: {
      path: '$parent',
      preserveNullAndEmptyArrays: true
    },
  }
];

export const projectDefaultQuery = {
  $project: {
    'orchestratorTask.assigned.profile.avatarUrl': 1,
    'orchestratorTask.assigned.profile.firstName': 1,
    'orchestratorTask.assigned.profile.lastName': 1,
    'orchestratorTask.assigned._id': 1,
    'orchestratorTask.dependencies': 1,
    'orchestratorTask.organization': 1,
    'orchestratorTask.createdBy.profile.avatarUrl': 1,
    'orchestratorTask.createdBy.profile.firstName': 1,
    'orchestratorTask.createdBy.profile.lastName': 1,
    'orchestratorTask.createdBy._id': 1,
    'orchestratorTask.files': 1,
    'orchestratorTask.name': 1,
    'orchestratorTask.priority': 1,
    'orchestratorTask.type': 1,
    'orchestratorTask.state': 1,
    'orchestratorTask._id': 1,
    'project._id': 1,
    'project.name': 1,
    'epic.name': 1,
    'epic._id': 1,
    'epic.status': 1,
    'epic.reference': 1,
    'labels._id': 1,
    'labels.name': 1,
    'labels.color': 1,
    'parent.reference': 1,
    'parent._id': 1,
    order: 1,
    epicOrder: 1,
    archived: 1,
    board: 1,
    stage: 1,
    reference: 1,
    stageColor: '$stageObj.color',
    stageName: '$stageObj.name',
    createdAt: 1,
    updatedAt: 1
  }
};

projectTaskSchema.pre('save', async function<ProjectTask>() {
  await updateTaskSequence(this);
});

projectTaskSchema.pre('findOneAndUpdate', async function<Document>() {
  // TEMPORARY: To find a bug with broken stage in task
  await checkProjectStage(this._update);
});

async function updateTaskSequence(task: ProjectTask) {
  try {
    const sequence =  await SequenceSchema.findOneAndUpdate({ type: SequenceType.PROJECT, reference: task.project }, { $inc: { seq: 1 } }, { new: true }).lean();
    task.reference = `${sequence.key}-${sequence.seq}`;
  } catch (err) {
    logger.error('[TaskModel]: Error generating sequence', err);
    throw new Error('Error generating sequence');
  }
}

async function checkProjectStage(task: ProjectTask) {
  try {
    const { project, stage } = task;

    if (!!project && !!stage) {
      const boards = await BoardSchema.find({ project }).lean();

      if (!boards || !boards.length) return;

      const allProjectStages = [] as Stage[];
      boards.forEach((board: Board) => {
        allProjectStages.push(...board.stages);
      });

      if (!allProjectStages.length) return;

      const projectStage = allProjectStages.find((s: Stage) => s._id.toString() === stage.toString());
      if (!projectStage) {
        throw new Error('Not existing project stage');
      }
    }
  } catch (err) {
    logger.error('[TaskModel]: Error checking project stage', err);
    throw new Error('Error checking project stage');
  }
}

export type IProjectTask = Document & ProjectTask;
export const ProjectTaskSchema = Db.connection.model<IProjectTask>('ProjectTask', projectTaskSchema);

