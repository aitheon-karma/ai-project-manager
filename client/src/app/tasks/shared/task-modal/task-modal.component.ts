import {
  Component,
  ViewChild,
  Input,
  Output,
  OnInit,
  OnDestroy,
  HostListener,
  EventEmitter,
  OnChanges
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TaskParams } from '../models/task-params.interface';
import { ProjectTask, ProjectTasksRestService, ProjectsRestService } from '@aitheon/project-manager';
import { TaskModalService } from '../task-modal.service';
import { Subscription } from 'rxjs';
import { GenericConfirmComponent } from '../../../shared/components/generic-confirm/generic-confirm.component';
import { TaskFormComponent } from '../../task-form/task-form.component';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { EpicsRestService } from '@aitheon/project-manager';
import { environment } from 'src/environments/environment';
import { AuthService } from '@aitheon/core-client';
import { User } from '@aitheon/orchestrator';

@Component({
  selector: 'ai-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss']
})
export class TaskModalComponent implements OnInit, OnDestroy, OnChanges {

  constructor(
    private modalService: BsModalService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private epicService: EpicsRestService,
    private projectTasksRestService: ProjectTasksRestService,
    private taskModalService: TaskModalService,
    private projectService: ProjectsRestService,
    private authService: AuthService) { }

  @ViewChild('taskModal') private taskModal: TaskFormComponent;
  @ViewChild('genericConfirm') private genericConfirm: GenericConfirmComponent;

  taskModalRef: BsModalRef;
  subscriptions: Subscription[] = [];
  showTaskMenu = false;
  readOnly = false;
  valueInNewTaskChanged: any = '';
  me: User;
  isUserAdmin = false;
  isCreator = false;
  loading = true;

  params: TaskParams;
  subTaskMode = false;
  taskFormShown = true;
  taskRole = '';
  @Input() headerMode = false;
  @Input() stages: any;
  @Output() modalClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() reloadTasks: EventEmitter<boolean> = new EventEmitter<boolean>();

  @HostListener('document:click', ['$event'])
  click() {
    this.showTaskMenu = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  escapeHandler(event: KeyboardEvent) {
    this.taskModalService.taskFormViewStatus$.next(true);
  }

  ngOnInit() {
    this.subscriptions.push(this.taskModalService.taskFormViewStatus$.subscribe(value => {
      this.taskFormShown = value;
    }));

    this.subscriptions.push(this.authService.currentUser.subscribe(user => {
      this.me = user;
    }));

    if (this.headerMode) {
      return;
    }

    this.subscriptions.push(this.taskModalService
      .subtaskStatusChanged.subscribe(value => {
        this.subTaskMode = value;
      }));

    this.subscriptions.push(this.taskModalService
      .taskChanged.subscribe(params => {
        params.callback = this.params.callback;
        this.params = params;
        this.setTaskQueryParam();
      }));

    this.watchRoute();
    this.setTaskQueryParam();
  }

  ngOnChanges() {
    this.isUserAdmin = false;
    this.isCreator = false;
  }

  public show(params?: TaskParams) {
    params.project = typeof params.project === 'object' ? params.project._id : params.project;
    this.readOnly = false;
    this.params = params;
    this.setTaskQueryParam();
    this.taskModalRef = this.modalService.show(this.taskModal, {
      class: 'modal-lg task-modal',
      ignoreBackdropClick: true, keyboard: false
    });
  }

  save(task: ProjectTask) {
    this.clearModalInfo();
    this.taskModalService.addSavedTask(task);
  }

  cancel(changed?: boolean) {
    if (!this.params.taskReference && this.valueInNewTaskChanged?.length > 0) {
      this.genericConfirm.show({
        text: `Task hasn't been created yet. Are you sure that you want to close the window?`,
        confirmText: 'Yes',
        callback: () => {
          this.clearModalInfo();
          this.taskModalService.addSavedTask(undefined);
      }});
    } else if (this.params.taskReference && changed) {
      this.clearModalInfo();
      this.taskModalService.addSavedTask(undefined);
      if (this.params.callback) {
        this.params.callback();
      }
    } else {
      this.clearModalInfo();
    }
  }

  close() {
    this.subTaskMode = false;
    this.taskModalService.taskEdited.next(true);
    this.modalClose.emit(true);
    this.valueInNewTaskChanged = '';
  }

  toggleSubTask() {
    this.subTaskMode = !this.subTaskMode;
  }

  ngOnDestroy() {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
  }

  changeToParent() {
    if (this.readOnly) {
      return this.toastr.info('Not allowed');
    }
    const params = _.clone(this.params);
    params.taskReference = params.parentReference;
    params.parentReference = undefined;
    params.stageId = undefined;
    params.callback = this.params.callback;
    this.params = params;
    this.setTaskQueryParam();
    this.reloadTasks.emit(true);
  }

  openTaskMenu(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.showTaskMenu = !this.showTaskMenu;
  }

  onRemoveTask() {
    this.genericConfirm.show({
      text: `Are you sure you want to delete this ${this.taskRole}?`,
      confirmText: 'Delete',
      callback: () => {
        this.taskModalService.deleteTask(this.params.taskReference);
      }
    });
  }

  private setTaskQueryParam() {
    if (this.params && this.params.taskReference) {
      this.router.navigate(
        [],
        {
          relativeTo: this.route,
          queryParams: { task: this.params.taskReference },
          queryParamsHandling: 'merge',
        });
    }
  }

  private clearModalInfo() {
    this.valueInNewTaskChanged = '';

    if (!this.taskModalRef) {
      return;
    }
    this.taskModalRef.hide();
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { task: undefined },
        queryParamsHandling: 'merge',
      });

    this.taskModalRef = null;
    sessionStorage.clear();
  }

  private watchRoute() {
    this.route.queryParams.subscribe(async params => {
      const { task } = params;

      if (!task && this.taskModalRef) {
        this.taskModalService.addSavedTask(undefined);
        return this.clearModalInfo();
      } else if (this.params && this.params.taskReference && task && (task !== this.params.taskReference)) {
        // task has been changed.. Reopen modal
        this.clearModalInfo();
        return this.show({taskReference: task, project: this.params.project});
      }

      let { projectId, epicId, boardId } = this.route.snapshot.params;

      if (task && !this.taskModalRef) {
        if (!epicId) {
          return this.getOwnerTaskByReference(task);
        }

        if (!projectId) {
          projectId  = await this.getProjectId(task, epicId);
        }

        setTimeout(() => this.show({ project: projectId, taskReference: task, boardId }), 300);
      }
    });
  }

  async getProjectId(reference: string, epicId: string) {
    const result = await this.epicService.getProjectId(epicId, reference).toPromise();
    return result.projectId;
  }

  getOwnerTaskByReference(task: string) {
    this.projectTasksRestService.findByReferenceInOwner(task).subscribe((t: ProjectTask) => {
      setTimeout(() => this.show({ project: t.project._id, taskReference: task, boardId: t.board }), 300);
    },
    err => this.toastr.error(err.error.message || err.error));
  }

  getValueInNewTaskChanged(value: any) {
    this.valueInNewTaskChanged = value;
  }

  copyLink() {
    const link = this.generateTaskLink();

    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = link;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.toastr.success('Task link copied to clipboard');
  }

  generateTaskLink() {
    const preLink = environment.production ? `https://${window.location.hostname}/project-manager` : `http://localhost:3000`;
    return `${preLink}/dashboard?task=${this.params.taskReference}`;
  }

  checkUserRights(task: any) {
    this.taskRole = task?.parent ? 'Subtask' : 'Task';
    if (task) {
      this.subscriptions.push(this.projectService
        .isAdmin(task.project).subscribe((isAdmin: any) => {
          this.isUserAdmin = isAdmin?.admin;
          this.loading = false;
        }));
      this.isCreator = task.orchestratorTask.createdBy._id === this.me._id;
    }
  }
}
