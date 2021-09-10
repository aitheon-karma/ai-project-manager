import Container, { Service, Inject } from 'typedi';
import { Label, LabelSchema } from './label.model';
import { GraphOutputsService } from '../core/graph-outputs.service';


@Service()
export class LabelsService {

  @Inject(type => GraphOutputsService)
  private graphService: GraphOutputsService;

  constructor() {
  }

  async list(query = {}): Promise<Label[]> {
    return await LabelSchema.find(query);
  }

  async listByProject(project: string, searchText: string = ''): Promise<Label[]> {
    const query = { project } as any;
    if (searchText) {
      query.name = { $regex: searchText, $options: 'i' };
    }
    return await LabelSchema.find(query);
  }

  async findById(labelId: string): Promise<Label> {
    return await LabelSchema.findById(labelId);
  }

  async create(label: Label, organization: string): Promise<Label> {
    const createdLabel = await LabelSchema.create(label);
    return createdLabel;
  }

  async update(labelId: string, label: Label): Promise<Label> {
    return await LabelSchema.findByIdAndUpdate(labelId, label);
  }

  async delete(labelId: string): Promise<any> {
    return await LabelSchema.findByIdAndDelete(labelId);
  }

  async removeMany(projectId: string): Promise<any> {
    return await LabelSchema.deleteMany({ 'project': projectId });
  }
}
