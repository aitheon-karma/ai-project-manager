import { Schema, Document, Model, model, Types } from 'mongoose';
import Db from '@aitheon/core-server/dist/config/db';
import { JSONSchema } from 'class-validator-jsonschema';
import { IsString, IsNotEmpty, IsEnum, IsNumber, ValidateNested, IsMongoId, IsDate, IsDefined, IsOptional, Min, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'bson';

@JSONSchema({ description: 'Project' })
export class ProjectGroup {

    @IsMongoId()
    @IsOptional()
    _id: string;

    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsMongoId()
    organization: string;

    @IsOptional()
    user: string;

    projects: Array<ObjectId>;

}

/**
 * Database schema/collection
 */
const projectGroupSchema = new Schema({
    name: String,
    description: String,
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['EXPANDED', 'COLLAPSED'],
        default: 'EXPANDED'
    },
    projects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Project'
        }
    ]
},
    {
        timestamps: true,
        collection: 'project_manager__project_groups'
    });

export type IProjectGroup = Document & ProjectGroup;
export const ProjectGroupSchema = Db.connection.model<IProjectGroup>('ProjectGroup', projectGroupSchema);
