import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';
import { Schema } from 'mongoose';
import { Type } from 'class-transformer';

export enum ProjectAccessType {
  OWNER = 'OWNER',
  SHARED = 'SHARED'
}

export enum ProjectMemberRoles {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

@JSONSchema({description: 'Project Member'})
export class ProjectMember {

  @ValidateNested()
  @IsOptional()
  role: ProjectMemberRoles;

  @IsOptional()
  user: any | string;

}

@JSONSchema({description: 'Project Roles'})
export class ProjectRole {

  @IsOptional()
  @IsEnum(ProjectAccessType)
  accessType: ProjectAccessType;

  @IsOptional()
  organization: any | string;

  @ValidateNested({each: true})
  @Type(() => ProjectRole)
  @IsOptional()
  members: ProjectMember[];

  @IsOptional()
  user: any;

  // TODO: add typings and swagger docs
  @IsOptional()
  teams: any;

}

export const projectRolesSchema = {
  _id: false,
  accessType: {
    type: String,
    enum: Object.keys(ProjectAccessType)
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },
  members: [{
      _id: false,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: Object.keys(ProjectMemberRoles)
      }
  }]
};
