import Container, { Service, Inject } from 'typedi';
import { ProjectGroupSchema, ProjectGroup } from './project-group.model';
import { ObjectId } from 'bson';


@Service()
export class ProjectGroupsService {

    async findAll(organizationId: any, userId: any): Promise<any> {
        const projectGroup = await ProjectGroupSchema.find({ $and: [{ 'organization': new ObjectId(organizationId) }, { 'user': new ObjectId(userId) }] }).sort({ 'createdAt': -1 });
        return projectGroup;
    }

    async findById(groupId: string): Promise<any> {
        const projectGroup = await ProjectGroupSchema.findById(groupId);
        return projectGroup;
    }

    async create(body: ProjectGroup): Promise<ProjectGroup> {
        const projectGroup = new ProjectGroupSchema(body);
        return projectGroup.save();
    }

    async update(projectGroupId: String, body: ProjectGroup): Promise<ProjectGroup> {
        return await ProjectGroupSchema.findByIdAndUpdate(projectGroupId, body, { new: true });
    }

    async remove(projectGroupId: string): Promise<any> {
        return await ProjectGroupSchema.remove({ '_id': projectGroupId });
    }

}
