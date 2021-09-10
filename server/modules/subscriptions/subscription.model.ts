import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';


export enum SubscriptionType {
  STAGE = 'STAGE',
  TASK = 'TASK',
  LABEL = 'LABEL'
}

/***
 * Subscription Type. Data Transfer object type
 */
@JSONSchema({ description: 'Subscription subscribe form for create method' })
export class SubscriptionSubscribeForm {

  @IsEnum(SubscriptionType)
  type: string;

  @IsMongoId()
  reference: string;

}

/***
 * Subscription Type. Data Transfer object type
 */
@JSONSchema({ description: 'Subscription model' })
export class Subscription {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsEnum(SubscriptionType)
  type: string;

  @IsMongoId()
  reference: string;

  @JSONSchema({
    items: { type: 'object' },
    type: 'array'
  })
  users: any[];

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
const subscriptionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.keys(SubscriptionType)
    },
    reference: Schema.Types.ObjectId,
      users: {
        type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      default: []
    },
  },
  {
    timestamps: true,
    collection: 'project_manager__subscriptions'
  }
);

export type ISubscription = Document & Subscription;
export const SubscriptionSchema = Db.connection.model<ISubscription>('Subscription', subscriptionSchema);
