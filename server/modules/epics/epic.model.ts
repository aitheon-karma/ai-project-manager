import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { SequenceSchema,  SequenceType } from '../sequences/sequence.model';
import { logger } from '@aitheon/core-server';


export enum EpicStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

/***
 * Epic Type. Data Transfer object type
 */
@JSONSchema({ description: 'Epic' })
export class Epic {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsOptional()
  organization: string;

  @IsString()
  @IsOptional()
  reference: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(EpicStatus)
  @IsOptional()
  status: EpicStatus;

  @IsDateString()
  @IsOptional()
  startDate: Date;

  @IsDateString()
  @IsOptional()
  endDate: Date;

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
const epicSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    name: {
      type: String,
      trim: true
    },
    description: String,
    status: {
      type: String,
      enum: Object.keys(EpicStatus),
      default: EpicStatus.ACTIVE
    },
    reference: {
      uppercase: true,
      type: String
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'project_manager__epics'
  }
);

epicSchema.pre('save', function(next) {
  const self: any = this;
  SequenceSchema.findOneAndUpdate({
      type: SequenceType.ORGANIZATION,
      reference: self.organization,
      key: 'EPIC'
    },
    { $inc: { seq: 1 } },
    {upsert: true, new: true},
    function(err, sequence: any) {
      if (err) {
        logger.error('[EpicModel]: Error generating sequence', err);
        next(err);
      }
      self.reference = `${sequence.key}-${sequence.seq}`;
      next();
    });
});

export type IEpic = Document & Epic;
export const EpicSchema = Db.connection.model<IEpic>('Epic', epicSchema);
