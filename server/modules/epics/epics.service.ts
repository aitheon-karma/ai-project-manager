import Container, { Service, Inject } from 'typedi';
import { EpicSchema, Epic, EpicStatus } from './epic.model';
import { ProjectTasksService } from '../project-tasks/project-tasks.service';
import { ProjectTask, ProjectTaskSchema } from '../project-tasks/project-task.model';
import { GraphOutputsService } from '../core/graph-outputs.service';
import { ProjectStatus } from '../projects/project.model';


@Service()
export class EpicsService {

  @Inject()
  projectTaskService: ProjectTasksService;
  private graphService: GraphOutputsService;

  constructor() {
    this.graphService = Container.get(GraphOutputsService);
  }


  async findAll(orgId: string, status: string, searchText: string = '', includeTasks: boolean = true): Promise<any> {
    const query = { organization: orgId, status: EpicStatus.ACTIVE } as any;
    if (status) {
      query.status = status;
    }
    if (searchText) {
      query.name = {$regex: searchText, $options: 'i'};
    }
    let epics = await EpicSchema.find(query) as any;
    if (includeTasks) {
      epics = await this.getTasksByEpic(epics);
    }
    return epics;
  }

  getTasksByEpic(epics: Array<Epic>): Promise<Epic[]> {
    return Promise.all(
      epics.map(async (epic: any) => {
        const tasks = await this.projectTaskService.listByEpic(epic._id, epic.status === ProjectStatus.ARCHIVED);
        let doneTasksCount = 0;
        let unDoneTasksCount = 0;
        tasks.forEach((task: ProjectTask) => {
          if (task.orchestratorTask && task.orchestratorTask.state === 'DONE') {
            doneTasksCount++;
          } else {
            unDoneTasksCount++;
          }
        });
        epic = epic.toObject();
        epic.tasks = {
          doneTasks: doneTasksCount,
          unDoneTasks: unDoneTasksCount
        };
        return epic;
      })
    );
  }

  async create(body: any, organization: string): Promise<Epic> {
    const epic = await EpicSchema.create(body);
    this.graphService.epicCreated({organization, epic: epic.toObject()});
    return epic;
  }

  async update(epicId: string, body: any, organization: string): Promise<Epic> {
    const result = await EpicSchema.findByIdAndUpdate(epicId, body, { new: true });
    this.graphService.epicUpdated({ organization, epic: result.toObject()} );
    return await EpicSchema.findByIdAndUpdate(epicId, body, { new: true });
  }

  async remove(epicId: string, status: string, organization: string): Promise<any> {
    const epic = await EpicSchema.findById(epicId);
    if (status === EpicStatus.DELETED) {
      await this.projectTaskService.removeFromEpic(epicId);
      await this.graphService.epicDeleted({organization, epic: epic.toObject()});
    } else if (status === EpicStatus.ARCHIVED) {
      await this.projectTaskService.archiveProjectTasksInEpic(epicId, true);
      await this.graphService.epicArchived({organization, epic: epic.toObject()});
    } else {
      await this.projectTaskService.archiveProjectTasksInEpic(epicId, false);
    }
    return await EpicSchema.findByIdAndUpdate(epicId, { status });
  }

  async getById(epicId: string): Promise<any> {
    let epic = await EpicSchema.findById(epicId);
    epic = epic.toObject();
    return epic;
  }

  async hasEpicAccess(epicId: string, orgId: string): Promise<boolean> {
    let epic = await EpicSchema.findById(epicId);
    epic = epic.toObject();
    return epic && (epic.organization.toString() === orgId);
  }

  async getProjectIdByEpic(epicId: string, reference: string) {
    return ProjectTaskSchema.findOne({epic: epicId, reference}, 'project');
  }

}
