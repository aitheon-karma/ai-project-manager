import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  TemplateRef,
} from '@angular/core';
import {
  Board,
  Epic,
  EpicsRestService,
  BoardsRestService,
  ProjectTasksRestService,
  ProjectTask,
  Stage as DbStage,
  Label,
  LabelsRestService,
} from '@aitheon/project-manager';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { TaskModalComponent } from '../../tasks/shared/task-modal/task-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { EpicFormComponent } from '../../shared/components/epic-form/epic-form.component'
import { GenericConfirmComponent } from 'src/app/shared/components/generic-confirm/generic-confirm.component';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { SharedService } from '../../shared/services/shared.service';

import { Subscription } from 'rxjs';

import * as _ from 'lodash';

interface Stage {
  stage: string;
  label: string;
  order: string;
  tasks: ProjectTask[];
  taskStages?: any[];
}

@Component({
  selector: 'ai-epic-dashboard',
  templateUrl: './epic-dashboard.component.html',
  styleUrls: ['./epic-dashboard.component.scss']
})
export class EpicDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(TaskModalComponent) taskModal: TaskModalComponent;
  @ViewChild('epicModal') epicModal: TemplateRef<any>;
  @ViewChild('filters') filtersContent: ElementRef;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;

  private subscriptions: Subscription[] = [];
  private _epicId: string;
  public board: Stage[] = [];
  loading = true;
  epic: Epic;
  tasksBoards: any;
  taskBoard: any;
  taskStages: {
    [key: string]: DbStage,
  };
  draggingTask: ProjectTask;
  stagesIds: string[] = [];
  tasks: ProjectTask[];
  projectData = {};
  filtersHeight: number;
  innerHeight: number;
  epicModalRef: BsModalRef;
  stageContainerHeight: any;
  stageTasksHeight: any;
  filters: any;
  allStages: any = [];
  currentStage: string;

  constructor(
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private epicsRestService: EpicsRestService,
    private boardsRestService: BoardsRestService,
    private projectTasksRestService: ProjectTasksRestService,
    private toastrService: ToastrService,
    private labelsRestService: LabelsRestService,
    private modalService: BsModalService,
    public domSanitizer: DomSanitizer,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this._epicId = this.route.snapshot.paramMap.get('epicId');
    this.getEpic();
  }

  ngAfterViewInit() {
    this.innerHeight = (window.screen.height);
    this.filtersHeight = this.filtersContent.nativeElement.clientHeight;
    this.stageContainerHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 218px - ' + this.filtersHeight + 'px)');
    this.stageTasksHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 282px - ' + this.filtersHeight + 'px)');
  }

  getEpic(userFilters?) {
    this.loading = true;
    this.subscriptions.push(this.epicsRestService.findById(this._epicId)
      .subscribe((epic: any) => {
        this.epic = epic;
        this.setFilters();

        const filters = {
          epic: this._epicId,
          archived: epic.status === 'ARCHIVED',
          ...userFilters
        };
        this.filters = filters;
          this.subscriptions.push(this.projectTasksRestService.search(filters, true).subscribe((tasks: ProjectTask[]) => {
            const assinersArr = [];
            const createdByArr = [];
            const labelsArr = [];
            const projectsArr = [];
            this.tasks = tasks;
            this.setStages();

            this.tasks.forEach((task: ProjectTask) => {
              assinersArr.push(...task.orchestratorTask.assigned);
              createdByArr.push(task.orchestratorTask.createdBy);
              labelsArr.push(...task.labels);
              projectsArr.push(task.project);
            });

            this.projectData['assignees'] = _.uniqBy(assinersArr, '_id');
            this.projectData['createdBy'] = _.uniqBy(createdByArr, '_id');
            this.projectData['labels'] = _.uniqBy(labelsArr, '_id');
            this.projectData['projects'] = _.uniqBy(projectsArr, '_id');
            this.sharedService.filtersDataReady(this.projectData);

            this.loading = false;
          },
          (error: Error) => {
            this.toastrService.error(error.message || 'Unable to load tasks.');
          }));
        },
        (error: Error) => {
          this.toastrService.error(error.message || 'Unable to load epic.');
        }));
  }

  setStages() {
    const tasks = this.tasks;
    if (tasks) {
      const stagesObject = this.getStagesObject();
      const taskBoardsIds = [];
      for (const task of tasks) {
        const { board, orchestratorTask = {} } = task;
        if (!taskBoardsIds.includes(board)) {
          taskBoardsIds.push(board);
        }
        const { state = 'BACKLOG' } = orchestratorTask;
        const stageTasks = _.get(stagesObject, `${state}.tasks`, []) as ProjectTask[];
        stagesObject[state] = {
          ...stagesObject[state],
          tasks: [
            ...stageTasks,
            task,
          ],
          taskStages: [],
        };
      }
      for (const stage of Object.keys(stagesObject)) {
        stagesObject[stage].tasks = stagesObject[stage].tasks
          .sort((prev, next) => prev.epicOrder - next.epicOrder);
      }
      this.board = Object.values(stagesObject);
      this.setTasksBoards(taskBoardsIds);
    }
  }

  moveTaskBetweenStages(event: any, newStage: any) {
    if (
      event.isPointerOverContainer &&
      this.stagesIds.includes(event.container.id)
    ) {
      const { project } = this.draggingTask;
      const { reference, orchestratorTask } = this.draggingTask as any;
      const previousTask = { ...this.draggingTask };
      const task = {
        ...this.draggingTask,
        stage: newStage.stageId,
        orchestratorTask: {
          ...orchestratorTask,
          state: newStage.state
        },
      };
      if (project && reference) {
        const projectId = typeof project === 'object' ? project._id : project;
        this.updateBoard(task);
        this.subscriptions.push(this.projectTasksRestService.update(projectId, reference, task)
          .subscribe(
            () => {},
            (error: HttpErrorResponse) => {
              if (error.status === 403) {
                this.updateBoard(previousTask);
                return this.toastrService.error('You do not have permissions for this task');
              }
              this.toastrService.error(error.message || 'Unable to change task stage');
            }));
      }
    }
    this.draggingTask = null;
    this.currentStage = null;
  }

  moveTaskInEpic(event: any, tasks: ProjectTask[]): void {
    const { previousIndex, currentIndex } = event;
    const oldIds = tasks.map(({ _id }) => _id);
    moveItemInArray(tasks, previousIndex, currentIndex);
    const tasksIds = tasks.map(({ _id }) => _id);
    this.subscriptions.push(this.projectTasksRestService.reorderTasksInEpic({ tasks: tasksIds })
      .subscribe(() => {
          this.draggingTask = null;
          this.currentStage = null;
        },
        () => {
          this.toastrService.error('Unable to reorder task');
          this.draggingTask = null;
          this.currentStage = null;
          moveItemInArray(tasks, currentIndex, previousIndex);
        }));
  }

  updateBoard(task: ProjectTask) {
    const { orchestratorTask } = task;
    this.board = this.board.reduce((board, currentStage) => {
      const { tasks, stage } = currentStage;
      const updatedTasks = tasks.filter(({ _id }) => _id !== task._id);
      if (stage === orchestratorTask.state) {
        updatedTasks.push(task);
      }
      return [
        ...board,
        {
          ...currentStage,
          tasks: updatedTasks,
        },
      ];
    }, [] as Stage[]);
  }

  onStartDragging(task: ProjectTask, boardStage: any) {
    this.setTaskStages(task.board);
    this.currentStage = boardStage.stage;
    this.draggingTask = task;
    this.cd.detectChanges();
  }

  setTaskStages(boardId: string) {
    this.taskBoard = this.tasksBoards[boardId];
  }

  setTasksBoards(boardsIds: string[]) {
    const uniqueBoardsIds = Array.from(new Set(boardsIds));
    this.subscriptions.push(this.boardsRestService.listBoards({ boards: uniqueBoardsIds })
      .subscribe((boards: Board[]) => {
        boards.forEach(b => {
          this.allStages.push(...b.stages);
        });
        const boardsObject = {};
        const taskStages = [];
        for (const { stages, _id: boardId } of boards) {
          taskStages.push(...stages);

          for (const { name, _id: stageId, state } of stages) {
            const currentBoard = _.get(boardsObject, boardId, {});
            const currentStages = _.get(boardsObject, `${boardId}.${state}.stages`, []);
            boardsObject[boardId] = {
              ...currentBoard,
              [state]: {
                boardId,
                stages: [
                  ...currentStages,
                  {
                    stageId,
                    state,
                    name,
                  },
                ],
              }
            };
          }
        }
        this.tasksBoards = boardsObject;
        this.createStagesObject(taskStages);
        this.setStagesIds();
        this.loading = false;
      }));
  }

  createStagesObject(stages: DbStage[]) {
    const stagesObject = {};
    for (const stage of stages) {
      stagesObject[stage._id] = stage;
    }
    this.taskStages = stagesObject;
  }

  setStagesIds() {
    const ids = [];
    for (const board of Object.values(this.tasksBoards)) {
      for (const stage of Object.values(board)) {
        const stagesIds = stage.stages.map(({ stageId }) => stageId);
        ids.push(...stagesIds);
      }
    }
    this.stagesIds = ids;
  }

  getStagesObject(): { [key: string]: Stage } {
    const stages = ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'DONE'];
    const stagesObject = {};
    stages.forEach((stage, i) => {
      stagesObject[stage] = {
        order: `${i + 1}`,
        stage,
        label: this.getStageLabel(stage),
        tasks: [],
      };
    });
    return stagesObject;
  }

  openTaskModal(taskDetails: any) {
    this.taskModal.show({
      project: taskDetails.project,
      taskReference: taskDetails.reference,
      boardId: taskDetails.board,
      stageId: taskDetails.stage,
      epicId: taskDetails.epic._id,
      callback: (task: ProjectTask) => {
        return this.onTaskSaved(task);
      }
    });

  }

  onTaskSaved(task: ProjectTask) {
    this.getEpic(this.filters);
  }

  getStageLabel(stage: string): string {
    return stage.split('_')
      .map((word) => word.substr(0, 1) + word.substr(1).toLowerCase())
      .join(' ');
  }

  setFilters() {
    this.projectData['status'] = 'Epic';
    this.projectData['title'] = this.epic.name;
    this.projectData['description'] = this.epic.description;
  }

  calcFilterHeight() {
    this.filtersHeight = this.filtersContent.nativeElement.clientHeight;
    this.stageContainerHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 218px - ' + this.filtersHeight + 'px)');
    this.stageTasksHeight = this.domSanitizer.bypassSecurityTrustStyle('calc(100vh - 282px - ' + this.filtersHeight + 'px)');
  }

  openEpicForm(epic: Epic) {
    this.epic = epic;
    this.epicModalRef = this.modalService.show(this.epicModal, { backdrop: 'static' });
  }

  updateEpic(epicFormComponent: EpicFormComponent) {
    epicFormComponent.onSubmit(this.epic);
    this.getEpic();
    this.closeEpicModal();
  }

  deleteEpic(event: { epic: Epic, status: any }) {
    const { epic, status } = event;
    const epicName = epic.name;
    const messageStatus = epic.status === 'ARCHIVED' ? 'delete' : 'archive';
    this.genericConfirm.show({
      text: `Are you sure you want to ${messageStatus} "${epicName} epic"?`,
      callback: () => {
        epic.status = status;
        return this.onEpicRemove(epic);
      }
    });
  }

  onEpicRemove(epic: Epic) {
    this.subscriptions.push(this.epicsRestService.remove(epic._id, { status: epic.status }).subscribe(res => {
      this.closeEpicModal();
      this.toastrService.success(`Epic ${epic.status}`);
      this.router.navigateByUrl('/dashboard?tab=epics');
    }));
  }

  closeEpicModal() {
    if (!this.epicModalRef) {
      return;
    }
    this.epicModalRef.hide();
    this.getEpic(this.filters);
  }

  removeEpicFromFilters(epic: Epic) {
    this.deleteEpic({ epic: epic, status: epic.status === 'ARCHIVED' ? 'DELETED' : 'ARCHIVED' });
  }

  onDragArchivedEpic() {
    this.toastrService.error('You can\'t move stages and tasks if epic is archived!');
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe();
      } catch (e) {
      }
    }
  }
}

