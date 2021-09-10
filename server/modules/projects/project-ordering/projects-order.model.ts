import { Schema, Document } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsMongoId, IsOptional, IsDateString, IsBoolean, IsArray, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';



@JSONSchema({ description: 'Projects order' })
export class ProjectsOrder {

  @IsMongoId()
  @IsOptional()
  _id: string;

  @Type(() => Object)
  user: any;

  @Type(() => Object)
  organization: any;

  @IsArray()
  projects: any[];

}

/**
 * Database schema/collection
 */
const projectsOrderSchema = new Schema({

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  },

  projects: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Project'
    }],
    default: []
  }

},
  {
    timestamps: true,
    collection: 'project_manager__projects_order'
  }
);


export type IProjectsOrder = Document & ProjectsOrder;
export const ProjectsOrderSchema = Db.connection.model<IProjectsOrder>('ProjectsOrder', projectsOrderSchema);
