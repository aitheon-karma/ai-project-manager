import { Service, Inject, Container } from 'typedi';
import { RestService } from '../core/rest.service';
import { Current } from '@aitheon/core-server';
import { environment } from '../../environment';


export enum PM_PUSH_ACTIONS {
  CHANGE_TASK_COLUMN = 'CHANGE_TASK_COLUMN', // Project-manager: Task was added/removed to the column (after subscription to a column)
  TAGGED_IN_COMMENT = 'TAGGED_IN_COMMENT',   // Project-manager: Were tagged in a comment
  TAGGED_IN_TASK = 'TAGGED_IN_TASK',      // Project-manager: Were tagged in a task
  COMMENT_REPLY = 'COMMENT_REPLY',       // Project-manager: New reply to your comment
  TASK_UPDATED = 'TASK_UPDATED',        // Project-manager: Task that you subscribed to has updates
  TASK_ASSIGNED = 'TASK_ASSIGNED'
}

@Service()
export class PushNotificationsService {

  @Inject()
  restService: RestService;


  constructor() {

  }

  async sendPushNotification(notification: Notification, users: string[], current: Current, action: string): Promise<any> {
    const body = { users, notification, organization: current.organization._id, service: environment.service._id, action };
    return this.restService.post({
      uri: `${this.getUsersBaseUrl()}/api/push-subscriptions/notify`,
      token: current.token,
      body
    });
  }


  private getUsersBaseUrl() {
    return environment.production ? '/users' : '';
  }

}

