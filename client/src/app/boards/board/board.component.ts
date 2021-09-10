import {
  Board,
  BoardsRestService,
  Label,
  LabelsRestService,
  Project,
  ProjectsRestService,
  ProjectTask,
  ProjectTasksRestService,
  Stage,
  Subscription as SubscriptionModel,
  SubscriptionsRestService
} from '@aitheon/project-manager';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Subscription } from 'rxjs';

import { map, switchMap } from 'rxjs/operators';
import { GenericConfirmComponent } from '../../shared/components/generic-confirm/generic-confirm.component';
import { ProjectStatus, State, SubscriptionType } from '../../shared/constants/enums';
import { SharedService } from '../../shared/services/shared.service';
import { TaskModalService } from '../../tasks/shared/task-modal.service';
import { TaskModalComponent } from '../../tasks/shared/task-modal/task-modal.component';
import { FiltersPanelComponent } from './../../shared/components/filters-panel/filters-panel.component';

export interface DropResult {
  removedIndex: number | null;
  addedIndex: number | null;
  payload?: any;
  element?: HTMLElement;
}

@Component({
  selector: 'ai-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('stageEditModal') stageEditModal: TemplateRef<any>;
  @ViewChild('boardContent', { read: ElementRef }) public boardContent: ElementRef;
  @ViewChild('filters') filtersContent: ElementRef;
  @ViewChild('filtersPanel') filtersPanel: FiltersPanelComponent;
  @ViewChild(TaskModalComponent) taskModal: TaskModalComponent;

  subscriptions: Subscription[] = [];
  loading: boolean;
  board: Board;
  tasks: ProjectTask[];
  project: Project;
  showMoreStageOpenId: string;
  actionDropdown = false;
  State = State;
  stageEditModalRef: BsModalRef;
  selectedStage: Stage;
  disableRightScroll = true;
  disableLeftScroll: boolean;
  projectId: string;
  boardId: string;
  assignees: any[] = [];
  priorities = [
    { name: 'HIGHEST', value: 4 },
    { name: 'HIGH', value: 3 },
    { name: 'MEDIUM', value: 2 },
    { name: 'LOW', value: 1 },
  ];
  types = [{ name: 'Task', value: 'TASK' }, { name: 'Story', value: 'STORY' }, { name: 'Issue', value: 'ISSUE' }];
  private taskModalSubscription: Subscription;
  createdBy: any[] = [];
  projectData = {};
  filtersHeight: number;
  innerHeight: number;
  hideBoard = false;
  stageContainerHeight: any;
  stageTasksHeight: any;
  form: any;
  isAdmin: boolean;
  accessType: string;
  isTaskDragging: boolean;
  disableMove = false;

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    event.stopPropagation();
    this.actionDropdown = false;
    this.showMoreStageOpenId = undefined;
  }

  constructor(
    private toastr: ToastrService,
    private taskService: ProjectTasksRestService,
    private projectsService: ProjectsRestService,
    private subscriptionsRestService: SubscriptionsRestService,
    private boardRestService: BoardsRestService,
    private labelsRestService: LabelsRestService,
    private modalService: BsModalService,
    private route: ActivatedRoute,
    private taskModalService: TaskModalService,
    public domSanitizer: DomSanitizer,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
  ) {
    const projectId = this.route.parent.snapshot.params.projectId;
    this.getBoardData(projectId);
    this.getLabels(projectId);
  }

  ngOnInit() {
    this.subscriptions.push(this.taskModalService.savedTask$.subscribe((task: ProjectTask) => {
      this.resetBoardData();
    }));
    this.checkAccess();
  }

  ngAfterViewInit() {
    this.innerHeight = (window.screen.height);
    this.filtersHeight = this.filtersContent.nativeElement.clientHeight;
    this.stageContainerHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 233px - ' + this.filtersHeight + 'px)');
    this.stageTasksHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 298px - ' + this.filtersHeight + 'px)');
    this.detectChanges();
  }

  getFilterTasks(form: any) {
    this.form = form;
    const filters = {
      project: this.projectId,
      board: this.boardId,
      ...form
    };
    this.subscriptions.push(this.taskService.search(filters, true).subscribe((tasks: ProjectTask[]) => {
      this.tasks = tasks.filter((task: ProjectTask) => {
        return task.archived == (this.project.status === ProjectStatus.ARCHIVED);
      });
      this.getSortedStageTasks(this.tasks);
      this.sharedService.setLoading(false);
      this.detectChanges();
    }));
  }

  getSortedStageTasks(tasks: ProjectTask[]) {
    let tasksObj = {};

    if (tasks.length) {
      tasksObj = tasks
        .sort((a: ProjectTask, b: ProjectTask) => a.order - b.order)
        .reduce((accumulator, currentValue) => {
          if (accumulator[currentValue.stage]) {
            accumulator[currentValue.stage].push(currentValue);
          } else {
            accumulator[currentValue.stage] = [currentValue];
          }
          return accumulator;
        }, {});
    }

    this.board.stages = this.board.stages.map((stage: Stage) => {
      tasks = tasksObj[stage._id] || [];
      return {
        ...stage,
        tasks,
      };
    });
  }

  getBoardData(projectId: string) {
    const tasks$ = this.route.params.pipe(switchMap(params => {

      if (this.projectId) {
        this.filtersPanel.clearFilters();
      }

      this.sharedService.setLoading(true);
      this.loading = true;
      this.projectId = projectId;
      this.boardId = params.boardId;
      const filters = {
        project: this.projectId,
        board: this.boardId
      };
      return forkJoin([this.taskService.search(filters, true),
        this.boardRestService.getById(params.boardId),
        this.projectsService.getById(projectId)]).pipe(map(results => ({
        tasks: results[0],
        board: results[1],
        project: results[2]
      })));
    }));

    this.subscriptions.push(tasks$.subscribe(results => {
      this.board = results.board;
      this.tasks = results.tasks.filter((task: ProjectTask) => {
        return task.archived === (results.project.status === ProjectStatus.ARCHIVED);
      });
      this.getSortedStageTasks(this.tasks);
      const assinersArr = [];
      const createdByArr = [];
      this.tasks.forEach((task: ProjectTask) => {
        assinersArr.push(...task.orchestratorTask.assigned);
        createdByArr.push(task.orchestratorTask.createdBy);
      });
      this.project = results.project;
      this.projectData['assignees'] = _.uniqBy(assinersArr, '_id');
      this.projectData['createdBy'] = _.uniqBy(createdByArr, '_id');
      this.projectData['type'] = this.board.type;
      this.projectData['title'] = this.project.name;
      this.sharedService.setLoading(true);
      this.loading = false;
      this.getFilterTasks(this.form);
      this.checkStagesSubscriptions(this.board._id);
      this.detectChanges();
    }, err => {
      this.toastr.error(err.error.message || err.message);
    }));
  }

  resetBoardData() {
    this.disableMove = true;
    this.sharedService.boardDataRefreshing(true);
    const tasks$ = this.route.params.pipe(switchMap(params => {
      const filters = {
        project: this.projectId,
        board: this.boardId
      };
      return this.taskService.search(filters, true).pipe(map(results => ({
        tasks: results
      })));
    }));

    this.subscriptions.push(tasks$.subscribe(results => {
      this.getFilterTasks(this.form);
      this.detectChanges();
      this.disableMove = false;
      this.sharedService.boardDataRefreshing(false);
    }, err => {
      this.toastr.error(err.error.message || err.message);
    }));
  }

  checkStagesSubscriptions(boardId: string) {
    this.subscriptions.push(this.boardRestService.checkStageSubscriptions(boardId).subscribe((board: Board) => {
      this.board.stages.forEach((stage: Stage) => {
        const st = board.stages.find(s => s._id == stage._id);
        stage.isSubscribed = st.isSubscribed;
      });
    }));
  }

  openTaskModal(taskDetails: any, event?: Event) {
    if (event) {
      this.stopEvent(event);
    }

    this.taskModal.show({
      project: taskDetails.project || this.project._id,
      taskReference: taskDetails.reference,
      boardId: taskDetails.board || this.board._id,
      stageId: taskDetails.stage,
      callback: (task: ProjectTask) => this.onTaskSaved.bind(this, task),
    });
  }

  onTaskSaved(task: ProjectTask) {
    this.getBoardData(this.projectId);
  }

  onActionClick(event: Event, stageId: string) {
    event.stopPropagation();
    event.preventDefault();
    this.actionDropdown = !this.actionDropdown;
    if (this.showMoreStageOpenId === stageId) {
      return this.showMoreStageOpenId = undefined;
    }
    this.showMoreStageOpenId = stageId;
  }

  openRemoveStageModal(stage: Stage) {
    this.genericConfirm.show({
      headlineText: 'Remove column',
      confirmText: 'delete',
      text: ' ',
      callback: this.removeStage.bind(this, stage),
    });

    // TODO rewrite without [setTimeout]
    const timeout = setTimeout(() => {
      const q: any = document.getElementsByClassName('confirm-message');
      q[0].innerHTML = `Are you sure you want to delete <span style="color: #fff;">"${stage.name}"</span> column?`;
      clearTimeout(timeout);
    }, 0);
  }

  removeStage(stage: Stage) {
    if (stage.state === State.DONE) {
      return;
    }
    if (stage.tasks && stage.tasks.length) {
      return this.toastr.error('Clear this stage from tasks first');
    }
    this.board.stages = this.board.stages.filter((s: Stage) => {
      return s._id !== stage._id;
    }).map((s: Stage, i: number) => {
        s.order = i + 1;
        return s;
      });
    this.subscriptions.push(this.boardRestService.update(this.board._id, this.board).subscribe(result => {
      this.toastr.success('Column deleted successfully');
    }));
  }

  hideBoardUI(event: Event): void {
    this.stopEvent(event);
    this.genericConfirm.show({
      text: `Do you feel the power to overcome fear?`, confirmText: 'Yes, my lord', callback: () => {
        this.hideBoard = true;
      }
    });
  }

  openEditStageModal(stage: any) {
    this.selectedStage = stage;
    this.stageEditModalRef = this.modalService.show(this.stageEditModal,
      Object.assign({}, { class: 'superbigmodal modal-lg', id: 'positionEditModal' })
    );
  }

  onCloseStageFormModal() {
    this.stageEditModalRef.hide();
  }

  onStageSave(stage: Stage) {
    if (stage._id) {
      this.updateStage(stage);
    } else {
      this.createStage(stage);
    }
  }

  updateStage(stage: Stage) {
    this.board.stages = this.board.stages.map((s: Stage) => {
      if (s._id === stage._id) {
        return stage;
      }
      return s;
    });
    this.subscriptions.push(this.boardRestService.update(this.board._id, this.board).subscribe());
  }

  createStage(stage: Stage) {
    this.board.stages = [...this.board.stages, stage];
    this.subscriptions.push(this.boardRestService.update(this.board._id, this.board).subscribe((board: Board) => {
      this.board = board;
      this.getSortedStageTasks(this.tasks);
    }));
  }

  scrollRight() {
    this.disableLeftScroll = true;
    this.boardContent.nativeElement.scrollTo({
      left: (this.boardContent.nativeElement.scrollLeft + 320),
      behavior: 'smooth'
    });
    // this.disableRightScroll = false;
    // this.disableLeftScroll = true;
  }

  scrollLeft() {
    this.disableRightScroll = true;
    this.boardContent.nativeElement.scrollTo({
      left: (this.boardContent.nativeElement.scrollLeft - 320),
      behavior: 'smooth'
    });
    // this.disableLeftScroll = false;
    // this.disableRightScroll = true;
  }

  getLabels(projectId: string) {
    this.subscriptions.push(this.labelsRestService.listByProject(projectId).subscribe((labels: Label[]) => {
      this.projectData['labels'] = labels;
    }));
  }

  toggleSubscription(stage: Stage) {
    if (!stage.isSubscribed) {
      this.openSubscribeModal(stage);
    } else {
      this.processSubscription(stage);
    }
  }

  processSubscription(stage: Stage) {
    this.subscriptions.push(this.subscriptionsRestService.subscribe({
      type: SubscriptionType.STAGE,
      reference: stage._id
    }).subscribe((subscription: SubscriptionModel) => {
      this.toastr.success(`Successfully ${stage.isSubscribed ? 'unsubscribed' : 'subscribed'}`);
      stage.isSubscribed = !stage.isSubscribed;
    }));
  }

  openSubscribeModal(stage: Stage) {
    this.genericConfirm.show({
      headlineText: 'Column subscription',
      confirmText: 'Subscribe',
      text: `Aitheon will send you email notifications about tasks moved to and from this column: "${stage.name}". You can always click Unsubscribe to stop receiving notifications. Would you like to subscribe to notifications about changes in this column?`,
      callback: this.processSubscription.bind(this, stage),
    });
  }

  calcFilterHeight() {
    this.filtersHeight = this.filtersContent.nativeElement.clientHeight;
    this.stageContainerHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 233px - ' + this.filtersHeight + 'px)');
    this.stageTasksHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 298px - ' + this.filtersHeight + 'px)');
  }

  checkAccess() {
    this.subscriptions.push(this.projectsService.isAdmin(this.projectId).subscribe((payload: any) => {
      this.isAdmin = payload.admin;
      this.accessType = payload.accessType;
    }));
  }

  onStageDrop(dropResult: DropResult) {
    if (!dropResult) {
      return;
    }
    if (this.project.status === 'ARCHIVED') {
      this.toastr.error('Project is archived!');
      return;
    }
    const { removedIndex, addedIndex, payload } = dropResult;
    this.board.stages.splice(removedIndex, 1);
    this.board.stages.splice(addedIndex, 0, payload);
    this.board.stages.forEach((stage: Stage, i: number) => {
      stage.order = i + 1;
    });
    this.subscriptions.push(this.boardRestService.update(this.board._id, this.board).subscribe());
    this.detectChanges();
    this.isTaskDragging = false;
    this.resetBoardData();
  }

  onTaskDrop(newStageIndex: number, dropResult: DropResult): void {
    this.isTaskDragging = false;
    if (!dropResult) {
      return;
    }

    if (this.project.status === 'ARCHIVED') {
      this.toastr.error('Project is archived!');
      return;
    }
    const { addedIndex, payload } = dropResult;
    if (addedIndex !== null) {
      const { taskIndex, stageIndex, task } = payload;
      this.board.stages[stageIndex].tasks.splice(taskIndex, 1);
      this.board.stages[newStageIndex].tasks.splice(addedIndex, 0, task);

      let orderedTasks = {} as any;
      if (stageIndex === newStageIndex) {
        orderedTasks = {
          currentStageTasks: this.board.stages[stageIndex].tasks,
        };
      } else {
        const currentTasks = this.board.stages[newStageIndex].tasks.map((boardTask: ProjectTask) => {
          if (boardTask.stage) {
            boardTask.stage = this.board.stages[newStageIndex]._id;
          }
          return boardTask;
        });
        const draggedTask = payload.task;
        orderedTasks = {
          previousStageTasks: this.board.stages[stageIndex].tasks,
          currentStageTasks: currentTasks,
          draggedTask: {
            ...draggedTask,
            stage: this.board.stages[newStageIndex],
          },
          previousStage: this.board.stages[stageIndex]._id,
        };
      }
      this.subscriptions.push(this.taskService.reorderTasks(this.project._id, orderedTasks).subscribe());
      this.detectChanges();
    }
  }

  getTaskDragData(stageIndex: number): (i: number) => {
    task: ProjectTask,
    taskIndex: number,
    stageIndex,
  } {
    return (taskIndex: number) => ({
      task: this.board.stages[stageIndex].tasks[taskIndex],
      stageIndex,
      taskIndex,
    });
  }

  getStageDragData(): (i: number) => any {
    return (index: number) => this.board.stages[index];
  }

  onTaskDrag(): void {
    this.isTaskDragging = true;
    this.detectChanges();
  }

  detectChanges(): void {
    try {
      this.cdr.detectChanges();
    } catch (e) {
    }
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  ngOnDestroy(): void {
    if (this.taskModalSubscription) {
      this.taskModalSubscription.unsubscribe();
    }
  }

  boardContentScrolled() {
    this.disableLeftScroll = this.boardContent.nativeElement.scrollLeft > 30;
    this.disableRightScroll = this.boardContent.nativeElement.scrollLeft <
      this.boardContent.nativeElement.scrollWidth - this.boardContent.nativeElement.clientWidth - 30;
  }
}
