import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectTask } from '../project-tasks/project-task.model';

/***
 * Board Type. Data Transfer object type
 */


export enum BoardType {
  ISSUE = 'ISSUE',
  MAIN = 'MAIN',
  CUSTOM = 'CUSTOM'
}

export enum State {
  BACKLOG = 'BACKLOG',
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export const defaultStages: Stage[] = [{
  state: State.BACKLOG,
  order: 1,
  color: '#7e7e7e',
  default: true,
  name: 'Backlog'
},
{
  state: State.TO_DO,
  color: '#7e7e7e',
  default: true,
  name: 'To do',
  order: 2
},
{
  state: State.IN_PROGRESS,
  color: '#ed9438',
  default: true,
  name: 'In Progress',
  order: 3
},
{
  state: State.DONE,
  color: '#67b231',
  default: true,
  name: 'Done',
  order: 4
}];




@JSONSchema({ description: 'Stage' })
export class Stage {

  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  name?: string;

  @IsEnum(State)
  state?: string;

  @IsString()
  color?: string;

  @IsBoolean()
  default: boolean;

  @IsNumber()
  order: number;

  // Only for frontend
  @IsBoolean()
  isSubscribed?: number;

  // Only for frontend
  @IsOptional()
  @IsArray()
  tasks?: ProjectTask[];

}


@JSONSchema({ description: 'Project Board' })
export class Board {

  @IsMongoId()
  _id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(BoardType)
  type?: BoardType;

  @IsOptional()
  project: any;

  @ValidateNested({ each: true })
  @Type(() => Stage)
  stages: Stage[];
}

/**
 * Database schema/collection
 */
const boardSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: Object.keys(BoardType)
  },
  stages: [{
    name: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      enum: Object.keys(State),
      default: State.BACKLOG
    },
    color: String,
    default: {
      type: Boolean,
      default: false
    },
    order: Number
  }]
},
  {
    timestamps: true,
    collection: 'project_manager__boards' // TODO: change this later
  });

export type IBoard = Document & Board;
export const BoardSchema = Db.connection.model<IBoard>('Board', boardSchema);
