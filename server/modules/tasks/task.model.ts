import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsBoolean, IsNotEmpty, IsArray, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDefined, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// Do not update the schema to manipulate the data

export enum TaskType {
  TASK = 'TASK',
  STORY = 'STORY'
}

export enum TaskSubtype {
  BUG = 'BUG',
  ISSUE = 'ISSUE',
  ERROR = 'ERROR',
  FEATURE_REQUEST = 'FEATURE_REQUEST'
}





@JSONSchema({ description: 'File schema' })
export class FileModel {
  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contentType: string;

  @IsOptional()
  @IsString()
  signedUrl: string;
}


@JSONSchema({ description: 'Task model' })
export class Task {

  @IsMongoId()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  orderIndex: number;

  @IsEnum(TaskSubtype)
  subtype: TaskSubtype;

  @IsNumber()
  priority: number;

  @IsString()
  state: string;

  @IsOptional()
  @IsEnum(TaskType)
  type: TaskType;

  @IsDefined()
  createdBy: any;

  @IsOptional()
  @Type(() => Object)
  project: any;

  @IsOptional()
  @Type(() => Object)
  parentTask: any;

  @IsOptional()
  @JSONSchema({
    items: { type: 'object' },
    type: 'array'
  })
  assigned: any[];

  @IsString()
  @IsOptional()
  service: string;

  @IsOptional()
  @Type(() => Object)
  organization: any;


  @ValidateNested({ each: true })
  @Type(() => FileModel)
  files: FileModel[];

  @IsOptional()
  @Type(() => Object)
  startDate: Date;

  @IsOptional()
  @Type(() => Object)
  finishDate: Date;

  @IsOptional()
  @IsDateString()
  createdAt: Date;

  @IsOptional()
  @IsDateString()
  updatedAt: Date;

}

/**
 * Database schema/collection
 */
const taskSchema = new Schema({
  name: String,
  description: String,
  orderIndex: Number,
  priority: Number,
  state: String,
  type: {
    type: String,
    enum: Object.keys(TaskType)
  },
  subtype: {
    string: String,
    enum: Object.keys(TaskSubtype)
  },

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  parentTask: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  assigned: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  service: {
    type: String,
    ref: 'Service'
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  files: [{
    _id: Schema.Types.ObjectId,
    name: String,
    signedUrl: String,
    contentType: String
  }],
  startDate: Date,

  finishDate: Date,
},
  {
    timestamps: true,
    collection: 'orchestrator__tasks'
  });

export type ITask = Document & Task;
export const TaskSchema = Db.connection.model<ITask>('Task', taskSchema);
export const taskDefaultPopulate = '_id name type description files priority startDate finishDate assigned organization state createdBy';
