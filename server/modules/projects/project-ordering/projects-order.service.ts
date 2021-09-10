import { Service, Inject, Container } from 'typedi';
import { Transporter, TransporterService, Event } from '@aitheon/transporter';
import { ProjectsOrder, ProjectsOrderSchema } from './projects-order.model';

@Service()
@Transporter()
export class ProjectsOrderService extends TransporterService {

  constructor() {
    super(Container.get('TransporterBroker'));
  }

  async create(user: string, organization: string, projects: string[]): Promise<ProjectsOrder> {
    return ProjectsOrderSchema.update({ user, organization }, { user, organization, projects }, { upsert: true, new: true });
  }

  async list(user: string, organization: string): Promise<ProjectsOrder> {
    return ProjectsOrderSchema.findOne({ user, organization }).lean();
  }

}
