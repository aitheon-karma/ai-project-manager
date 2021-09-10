import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { ProjectTask } from '@aitheon/project-manager';
import { TaskParams } from './models/task-params.interface';


@Injectable({
  providedIn: 'root'
})

export class TaskModalService {

  constructor() { }

  private savedTask: Subject<ProjectTask> = new Subject<ProjectTask>();
  private subtaskStatusChange$ = new Subject<boolean>();
  private changeTask$ = new Subject<TaskParams>();
  public taskEdited = new Subject<boolean>();
  private deleteHandler = new Subject<string>();
  private readOnly = new Subject<boolean>();
  private scrollDown = new Subject<boolean>();

  public taskFormViewStatus$ = new BehaviorSubject<boolean>(true);


  get savedTask$() {
    return this.savedTask.asObservable();
  }

  addSavedTask(task: ProjectTask) {
    this.savedTask.next(task);
  }

  get subtaskStatusChanged() {
    return this.subtaskStatusChange$.asObservable();
  }

  changeStatus(enabled: boolean) {
    this.subtaskStatusChange$.next(enabled);
  }

  get taskChanged() {
    return this.changeTask$.asObservable();
  }

  changeTask(params: TaskParams) {
    this.changeTask$.next(params);
  }

  get taskDeleted() {
    return this.deleteHandler.asObservable();
  }

  get readOnly$() {
    return this.readOnly.asObservable();
  }

  setReadOnly(value: boolean) {
    return this.readOnly.next(value);
  }

  deleteTask(ref: string) {
    return this.deleteHandler.next(ref);
  }

  setScrollDown(value: boolean) {
    return this.scrollDown.next(value);
  }

  get scrolledDown() {
    return this.scrollDown.asObservable();
  }
}
