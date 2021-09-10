import { Service, Inject, Container } from 'typedi';
import * as _ from 'lodash';
import { Transporter, TransporterService, InputService } from '@aitheon/transporter';
import { ProjectTask } from '../project-tasks/project-task.model';
import { Comment } from '../comments/comment.model';
import { Epic } from '../epics/epic.model';
import { ProjectTask as ProjectTaskSocket } from '../../sockets/ProjectManager/projectTask';
import { ProjectTaskID as ProjectTaskIdSocket } from '../../sockets/ProjectManager/projectTaskId';
import { Comment as CommentSocket } from '../../sockets/ProjectManager/comment';
import { Epic as EpicSocket } from '../../sockets/ProjectManager/epic';
import { EpicID as EpicIdSocket } from '../../sockets/ProjectManager/epicId';
import { Project as ProjectSocket } from '../../sockets/ProjectManager/project';
import { ProjectID as ProjectIdSocket } from '../../sockets/ProjectManager/projectId';
import { Stage as StageSocket } from '../../sockets/ProjectManager/stage';
import { Project } from '../projects/project.model';
import { logger } from '@aitheon/core-server';



@Service()
@Transporter()
export class GraphInputsService extends TransporterService {


  constructor() {
    super(Container.get('TransporterBroker'));
  }


  // Project tasks inputs
  @InputService()
  async createTask(data: ProjectTaskSocket) {
    try {
      logger.info(`[Create task]`, data);
      const { organization } = data as any;
      // await this.create(data, organization);
    } catch (err) {
      logger.error(`[Create task]`, err);
    }
  }

  @InputService()
  async updateTask(data: ProjectTaskSocket) {
    try {
      logger.info(`[Update task]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Update task]`, err);
    }
  }

  @InputService()
  async deleteTask(data: ProjectTaskIdSocket) {
    try {
      logger.info(`[Delete task]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Delete task]`, err);
    }
  }


  // Projects inputs
  @InputService()
  async createProject(data: ProjectSocket) {
    try {
      logger.info(`[Create project]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Create project]`, err);
    }
  }

  @InputService()
  async updateProject(data: ProjectSocket) {
    try {
      logger.info(`[Update project]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Update project]`, err);
    }
  }

  @InputService()
  async archiveProject(data: ProjectIdSocket) {
    try {
      logger.info(`[Archive project]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Archive project]`, err);
    }
  }

  @InputService()
  async addStage(data: StageSocket) {
    try {
      logger.info(`[Add stage]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Add stage]`, err);
    }
  }

  // Epics inputs
  @InputService()
  async createEpic(data: EpicSocket) {
    try {
      logger.info(`[Create epic]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Create epic]`, err);
    }
  }

  @InputService()
  async updateEpic(data: EpicSocket) {
    try {
      logger.info(`[Update epic]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Update epic]`, err);
    }
  }

  @InputService()
  async archiveEpic(data: EpicIdSocket) {
    try {
      logger.info(`[Archive epic]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Archive epic]`, err);
    }
  }


  // Comments inputs
  @InputService()
  async createComment(data: CommentSocket) {
    try {
      logger.info(`[Create comment]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Create comment]`, err);
    }
  }

  @InputService()
  async createReply(data: CommentSocket) {
    try {
      logger.info(`[Create reply]`, data);
      const { organization } = data as any;
    } catch (err) {
      logger.error(`[Create reply]`, err);
    }
  }

}
