import { Service, Inject, Container } from 'typedi';
import * as _ from 'lodash';
import { OutputService, Transporter, TransporterService } from '@aitheon/transporter';
import { ProjectTask } from '../project-tasks/project-task.model';
import { Comment } from '../comments/comment.model';
import { Epic } from '../epics/epic.model';
import { ProjectTask as ProjectTaskSocket } from '../../sockets/ProjectManager/projectTask';
import { Comment as CommentSocket } from '../../sockets/ProjectManager/comment';
import { Epic as EpicSocket } from '../../sockets/ProjectManager/epic';
import { Project as ProjectSocket } from '../../sockets/ProjectManager/project';
import { Project } from '../projects/project.model';
import { ProjectTasksService } from '../project-tasks/project-tasks.service';
import { LabelsService } from '../labels/labels.service';



@Service()
@Transporter()
export class GraphOutputsService extends TransporterService {

  @Inject(type => LabelsService)
  labelsService: LabelsService;

  @Inject(type => ProjectTasksService)
  projectTasksService: ProjectTasksService;

  constructor() {
    super(Container.get('TransporterBroker'));
  }

  @OutputService({ socket: ProjectTaskSocket })
  async taskCreated(data: { task: ProjectTask, organization: string, specialReference?: string }) {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization, specialReference: data.task.project } ;
    return result;
  }

  @OutputService({ socket: ProjectTaskSocket, core: true })
  async coreTaskCreated(data: { organization: string, task: ProjectTask, specialReference: string }) {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization } ;
    return result;
  }

  @OutputService({ socket: ProjectTaskSocket, core: true })
  async coreTaskUpdated(data: { organization: string, task: ProjectTask, specialReference: string }) {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization } ;
    return result;
  }


  @OutputService({ socket: ProjectTaskSocket })
  async taskDeleted(data: { organization: string, task: ProjectTask, specialReference: string }) {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization };
    return result;
  }


  @OutputService({ socket: ProjectTaskSocket })
  async taskUpdated(data: { organization: string, task: ProjectTask, specialReference: string }): Promise<ProjectTaskSocket> {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization } ;
    return result as any;
  }

  @OutputService({ socket: ProjectTaskSocket })
  async taskStateChanged(data: { organization: string, task: ProjectTask, specialReference: string }): Promise<ProjectTaskSocket> {
    const task = new ProjectTaskSocket();
    const result = { ...task, ...data.task, organization: data.organization } ;
    return result as any;
  }


  @OutputService({ socket: CommentSocket })
  async commentAdded(data: {organization: string, comment: Comment, specialReference: string}) {
    const comment = new CommentSocket();
    const result = { ...comment, ...data.comment, organization: data.organization };
    return result;
  }

  @OutputService({ socket: CommentSocket })
  async commentReplied(data: {organization: string, comment: Comment, specialReference: string}) {
    const comment = new CommentSocket();
    const result = { ...comment, ...data.comment, organization: data.organization };
    return result;
  }

  @OutputService({ socket: EpicSocket })
  async epicCreated(data: {organization: string, epic: Epic}) {
    const epic = new EpicSocket();
    const result = { ...epic, ...data.epic, organization: data.organization };
    return result;
  }

  @OutputService({ socket: EpicSocket })
  async epicUpdated(data: {organization: string, epic: Epic}) {
    const epic = new EpicSocket();
    const result = { ...epic, ...data.epic, organization: data.organization };
    return result;
  }

  @OutputService({ socket: EpicSocket })
  async epicArchived(data: {organization: string, epic: Epic}) {
    const epic = new EpicSocket();
    const result = { ...epic, ...data.epic, organization: data.organization };
    return result;
  }

  @OutputService({ socket: EpicSocket })
  async epicDeleted(data: {organization: string, epic: Epic}) {
    const epic = new EpicSocket();
    const result = { ...epic, ...data.epic, organization: data.organization };
    return result;
  }

  @OutputService({ socket: EpicSocket })
  async epicNewTask(data: {organization: string, epic: Epic}) {
    const epic = new EpicSocket();
    const result = { ...epic, ...data.epic, organization: data.organization };
    return result;
  }

  @OutputService({ socket: ProjectSocket })
  async projectCreated(data: {organization: string, project: Project}) {
    const project = new ProjectSocket();
    const result = { ...project, ...data.project, organization: data.organization };
    return result;
  }

  @OutputService({ socket: ProjectSocket })
  async projectUpdated(data: {organization: string, project: Project, specialReference: string}) {
    const project = new ProjectSocket();
    const result = { ...project, ...data.project, organization: data.organization };
    return result;
  }

  @OutputService({ socket: ProjectSocket })
  async projectArchived(data: {organization: string, project: Project, specialReference: string}) {
    const project = new ProjectSocket();
    const result = { ...project, ...data.project, organization: data.organization };
    return result;
  }

  @OutputService({ socket: ProjectSocket })
  async projectDeleted(data: {organization: string, project: Project, specialReference: string }) {
    const project = new ProjectSocket();
    const result = { ...project, ...data.project, organization: data.organization };
    return result;
  }

}
