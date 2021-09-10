import { Inject, Service } from 'typedi';
import { GraphsApi, SpecialSubgraphCreation } from '@aitheon/system-graph-server';
import { Current } from '@aitheon/core-server';
import { environment } from '../../environment';



@Service()
export class SystemGraphService {

  graphsApi: GraphsApi;

  constructor() {
    // this.graphsApi = new GraphsApi(`http://localhost:3001`);
    this.graphsApi = new GraphsApi(`https://${process.env.DOMAIN || 'dev.aitheon.com'}/system-graph`);
  }

  async createProjectSubgraph(name: string, reference: string, current: Current) {
    await this.graphsApi.createSpecialSubgraph(
      { name, reference, service: environment.service._id as any } as SpecialSubgraphCreation,
      {
        headers: {
          'Authorization': `JWT ${current.token}`,
          'organization-id': current.organization._id
        }
      });
  }



}
