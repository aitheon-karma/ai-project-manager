import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';


/***
 * Label Type. Data Transfer object type
 */
@JSONSchema({ description: 'Label' })
export class Label {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsDefined()
  project: string;

  @IsString()
  name: string;

  @IsString()
  color: string;

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
const labelSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    name: {
      type: String,
      trim: true
    },
    color: String
  },
  {
    timestamps: true,
    collection: 'project_manager__labels'
  }
);

export type ILabel = Document & Label;
export const LabelSchema = Db.connection.model<ILabel>('Label', labelSchema);
