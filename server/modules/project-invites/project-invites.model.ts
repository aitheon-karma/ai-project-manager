import { Schema, Document } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsEnum, IsMongoId, IsDefined, IsOptional, IsDateString } from 'class-validator';


export enum ProjectInviteStatus {
  INVITED = 'INVITED',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED'
}

/***
 * Project Invite Type. Data Transfer object type
 */
@JSONSchema({ description: 'ProjectInvite' })
export class ProjectInvite {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @IsDefined()
  project: string;

  @IsDefined()
  organization: string;

  @IsDefined()
  invitedBy: string;

  @IsDateString()
  @IsOptional()
  expiryDate: Date;

  @IsEnum(ProjectInviteStatus)
  @IsOptional()
  status: ProjectInviteStatus;

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
const projectInviteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    expiryDate: {
      type: Date,
      default: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    status: {
      type: String,
      enum: Object.keys(ProjectInviteStatus),
      default: ProjectInviteStatus.INVITED
    }
  },
  {
    timestamps: true,
    collection: 'project_manager__invites'
  }
);

export type IProjectInvite = Document & ProjectInvite;
export const ProjectInviteSchema = Db.connection.model<IProjectInvite>('ProjectInvite', projectInviteSchema);
