import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';




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

/***
 * Comment Type. Data Transfer object type
 */
@JSONSchema({ description: 'Comment' })
export class Comment {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsString()
  text: string;

  @IsDefined()
  createdBy: any;

  @IsOptional()
  parent: any;

  @IsDefined()
  task: any;

  @ValidateNested({ each: true })
  @Type(() => FileModel)
  @IsOptional()
  attachments: FileModel[];

  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @IsDateString()
  @IsOptional()
  updatedAt: Date;

}


/**
 * Database schema/collection
 */
const commentSchema = new Schema(
  {
    text: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    },
    task: {
      type: Schema.Types.ObjectId,
      // ref: 'TaskData'
    },
    attachments: [{
      _id: Schema.Types.ObjectId,
      name: String,
      signedUrl: String,
      contentType: String
    }],
  },
  {
    timestamps: true,
    collection: 'project_manager__comments'
  }
);

export type IComment = Document & Comment;
export const CommentSchema = Db.connection.model<IComment>('Comment', commentSchema);
