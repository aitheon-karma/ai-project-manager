import { ProjectTask } from '@aitheon/project-manager';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private modalTask: ProjectTask;
  private projectId: string;

  public getModalTask(): ProjectTask {
    return this.modalTask;
  }

  public setModalTask(task: ProjectTask): void {
    this.modalTask = task;
  }

  public setProject(projectId: string): void {
    this.projectId = projectId;
  }

  public getProject(): string {
    return this.projectId;
  }
}
