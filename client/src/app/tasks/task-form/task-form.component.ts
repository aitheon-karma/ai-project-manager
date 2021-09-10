import { ProjectsService } from '../../projects/projects.service';
import { TasksService } from '../tasks.service';
import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import {
  Epic,
  Label,
  Board,
  Stage,
  Project,
  Comment,
  TaskNotify,
  ProjectTask,
  EpicsRestService,
  SharedRestService,
  BoardsRestService,
  ProjectsRestService,
  ProjectTasksRestService,
} from '@aitheon/project-manager';
import { TaskParams } from '../shared/models/task-params.interface';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { TaskType, BoardType, State } from '../../shared/constants/enums';
import { TaskModalService } from '../shared/task-modal.service';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { DriveDocumentsService } from '@aitheon/core-client';
import { DESCRIPTION_EDITOR_CONFIG } from '../shared/constants/task-description.editor.config';

import * as _ from 'lodash';

const DEFAULT_TASK_TYPE = TaskType.TASK;

@Component({
  selector: 'ai-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnChanges, OnInit, OnDestroy {

  @ViewChild('taskFormScrollContainer') taskFormScrollContainer: ElementRef;
  @ViewChild('taskNameInput') taskNameInput: ElementRef;

  @Input() params: TaskParams;
  @Input() subTaskMode: boolean;

  @Output() canceled = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<any>();
  @Output() readOnly = new EventEmitter<boolean>();
  @Output() valueInNewTaskChanged = new EventEmitter<any>();
  @Output() taskDetails = new EventEmitter<any>();

  private initialFormValue: any;

  loading = true;
  isSaving: boolean;
  task: ProjectTask;
  isDueDateEnabled = false;
  stages: Stage[];
  isNew: boolean;
  taskForm: FormGroup;
  board: Board;
  project: Project;
  subscriptions: Subscription[] = [];
  submitted = false;
  priorities = [
    { name: 'Highest', value: 4, arrowClass: 'red' },
    { name: 'High', value: 3, arrowClass: 'orange' },
    { name: 'Medium', value: 2, arrowClass: 'yellow' },
    { name: 'Low', value: 1, arrowClass: 'green' }
  ];
  TaskType = TaskType;
  deleteSub: Subscription;
  taskReadonly = false;
  isArchived = false;
  commentsCount: number;
  scrollDown: boolean;
  ghostFocus = false;
  mentions: {
    id: string,
    userName: string,
    name: string,
    userId: string,
    logoURL: string
  }[];
  public descriptionConfig = DESCRIPTION_EDITOR_CONFIG;
  isAdmin = false;
  accessType: string;
  @HostListener('window:beforeunload', ['$event']) unloadHandler(event: Event) {
    if (this.isNew) {
      sessionStorage.clear();
      event.returnValue = false;
    }
  }

  constructor(private boardService: BoardsRestService,
              private taskService: ProjectTasksRestService,
              private taskModalService: TaskModalService,
              private sharedRestService: SharedRestService,
              private projectsRestService: ProjectsRestService,
              private projectsService: ProjectsService,
              private epicsService: EpicsRestService,
              private toastr: ToastrService,
              private fb: FormBuilder,
              private tasksService: TasksService,
              private driveDocumentsService: DriveDocumentsService
  ) {}

  get hasTaskChanged(): boolean {
    if (!this.taskForm) {
      return false;
    }
    return !_.isEqual(this.taskForm.value, this.initialFormValue);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.params) {
      this.loadTask();

      this.projectsRestService.getById(this.params.project).subscribe(proj => {
        if (proj.status === 'ARCHIVED') {
          this.taskReadonly = true;
          this.readOnly.emit(true);
          this.isArchived = true;
        }
      });
      if (this.params.epicId) {
        this.epicsService.findById(this.params.epicId).subscribe(epic => {
          if (epic.status === 'ARCHIVED') {
            this.taskReadonly = true;
            this.readOnly.emit(true);
            this.isArchived = true;
          }
        });
      }
    }
  }

  ngOnInit() {
    this.tasksService.setProject(this.params.project);

    this.requestDriveAccess();
    this.subscriptions.push(this.taskModalService.taskDeleted.subscribe(ref => {
      this.deleteTask(ref);
    }));

    this.subscriptions.push(this.taskModalService.taskEdited.subscribe(() => {
      this.submitted = true;
      this.isSaving = true;
      if (!this.taskForm || this.taskForm.valid || this.isNew) {
        this.cancel();
      } else {
        this.isSaving = true;
        return;
      }
    }));

    this.listenToTriggerScroll();
    this.getProjectMembers();
    this.descriptionConfig.mention.feeds[0].feed = this.getMentions.bind(this);
    this.checkAccess();
  }

  loadTask() {
    this.loading = true;
    const { taskReference, project } = this.params;

    let task$: Observable<any>;
    if (!this.params.taskReference) {
      task$ = of({});
    } else {
      task$ = this.taskService.findByReference(project, taskReference, this.params.epicId ? true : undefined)
        .pipe(switchMap(task => {
          if (!task.parent || this.params.parentReference) {
            return of({ parentRef: null, task: task });
          }
          return this.taskService.getReference(task.parent)
            .pipe(map(result => ({ parentRef: result.reference, task: task })));
        }));
    }

    forkJoin([
      this.getStages$(),
      task$,
      this.projectsRestService.getById(project, true),
    ]).subscribe(([stages, task, project]) => {
      this.tasksService.setModalTask(task.task);
      this.stages = stages;
      this.task = task.task;
      this.params.parentReference = this.params.parentReference || task.parentRef;
      this.isNew = !this.task;
      this.taskDetails.emit(task.task);
      this.buildForm();

      if (project.issueBoardEnabled) {
        this.watchTaskType();
      }
      this.project = project;
      this.loading = false;

      if (this.task.readOnly) {
        this.taskReadonly = true;
        this.readOnly.emit(true);
        this.taskModalService.setReadOnly(true);
      }
    }, err => {
      this.toastr.error('Server Error, could not load task');
      this.canceled.emit(true);
    });
  }

  listenToTriggerScroll(): void {
    this.subscriptions.push(this.taskModalService.scrolledDown.subscribe(() => {
      this.taskFormScrollContainer.nativeElement.scrollTo({ top: 100000, behavior: 'smooth' });
    }));
  }

  getProjectMembers(): void {
    this.subscriptions.push(this.projectsService.getProjectMembers(this.params.project).subscribe(members => {
      this.mentions = this.projectsService.getMentions(members);
    }));
  }

  private getStages$(boardType?: Board.TypeEnum) {
    let stages$: Observable<Stage[]>;
    if (this.params.boardId && !boardType) {
      stages$ = this.boardService.getById(this.params.boardId).pipe(map(board => {
        this.board = board;
        return board.stages;
      }));
    } else {
      stages$ = this.boardService.getByProjectId(this.params.project)
        .pipe(map(boards => {
          this.board = boards.find(b => b.type === (boardType || Board.TypeEnum.MAIN));
          return this.board.stages;
        }));
    }
    return stages$;
  }

  requestDriveAccess() {
    this.sharedRestService.requestDriveAccess()
      .subscribe(() => null, err => this.toastr.error(err));
  }


  private watchTaskType() {
    this.taskForm.get('type').valueChanges
      .pipe(switchMap((val: TaskType) => {
        return this.getStages$(val === TaskType.ISSUE ? BoardType.ISSUE : BoardType.MAIN);
      }))
      .subscribe(stages => {
        if (!_.isEqual(this.stages, stages)) {
          this.taskForm.get('stage').setValue(stages[0]._id);
        }
        this.stages = stages;
      });
  }

  buildForm() {
    if (this.isNew && !sessionStorage.getItem('task')) {
      this.task = new ProjectTask();
      this.task.orchestratorTask = {};
      this.task.orchestratorTask.assigned = [];
      this.task.orchestratorTask.files = [];
      this.task.labels = [];
    }

    if (sessionStorage.getItem('task')) {
      this.task = JSON.parse(sessionStorage.getItem('task'));
      this.task.labels = JSON.parse(sessionStorage.getItem('labels')) || [];
      this.task.orchestratorTask.assigned = JSON.parse(sessionStorage.getItem('assigned')) || [];
      this.task.epic = JSON.parse(sessionStorage.getItem('epic'));
    }

    if (this.task.orchestratorTask.finishDate) {
      this.isDueDateEnabled = true;
    }

    const assignedFormGroup: FormControl[] = this.task.orchestratorTask?.assigned
      .map((assignee: { _id: string }) => this.fb.control(assignee._id));
    const labelsFormGroup: FormControl[] = this.task.labels
      .map((label: Label) => this.fb.control(label._id));
    const orchestratorTask = this.task.orchestratorTask;
    const defaultBacklog: any = this.stages.find(s => s.state === State.BACKLOG) || {};
    if (!orchestratorTask.type && this.board.type === BoardType.ISSUE) {
      orchestratorTask.type = BoardType.ISSUE;
    }

    this.taskForm = this.fb.group({
      board: [this.board?._id],
      assigned: this.fb.array(assignedFormGroup),
      name: [orchestratorTask.name, [Validators.required]],
      description: [orchestratorTask.description || ''],
      type: [orchestratorTask.type || DEFAULT_TASK_TYPE, [Validators.required]],
      priority: [orchestratorTask.priority || 2, [Validators.required]],
      files: this.fb.array(orchestratorTask.files
        .map((file: any) => this.generateFilesGroup(file))),
      startDate: [new Date(orchestratorTask.startDate || new Date())],
      finishDate: [orchestratorTask.finishDate ? new Date(orchestratorTask.finishDate) : null],
      stage: [this.params.stageId || this.task.stage || defaultBacklog._id, [Validators.required]],
      labels: this.fb.array(labelsFormGroup),
      epic: [this.task.epic]
    });

    if (sessionStorage.getItem('newLabel')) {
      this.labelAdded(JSON.parse(sessionStorage.getItem('newLabel')));
      sessionStorage.removeItem('newLabel');
    }

    if (!this.isNew) {
      this.taskForm.get('type').disable();
    }

    if (this.task.readOnly) {
      ['description', 'stage', 'priority', 'name'].forEach(name => this.taskForm.get(name).disable());
    }
    this.initialFormValue = _.cloneDeep(this.taskForm.value);

    if (this.isNew) {
      this.taskForm.get('name').valueChanges.subscribe((res) => {
        this.valueInNewTaskChanged.emit(res);
      });

      this.taskForm.get('description').valueChanges.subscribe((res) => {
        this.valueInNewTaskChanged.emit(res);
      });
    }

    if (this.isNew) {
      this.runFocusTimer();
    }

    this.watchUpdateChanges();
  }

  private generateFilesGroup(file: any) {
    return this.fb.group({
      _id: [file._id],
      contentType: [file.contentType],
      name: [file.name],
      signedUrl: [file.signedUrl]
    });
  }

  onSubmit(callback?: any) {
    this.submitted = true;
    this.isSaving = true;
    this.trimTaskName();
    if (this.taskForm.invalid) {
      this.isSaving = false;
      return;
    }
    const task = this.buildTaskObject(this.taskForm.value);
    const epic = JSON.parse(sessionStorage.getItem('epic'))?._id;
    if (epic) {
      task.epic = epic;
    }
    const request$ = this.isNew ? this.taskService.create(this.params.project, task) :
      this.taskService.update(this.params.project, this.task.reference, task);

    request$.subscribe(updatedTask => {
      this.isSaving = false;
      sessionStorage.clear();
      this.saved.emit(updatedTask);
    });

    if (callback) {
      callback();
    }
  }

  private buildTaskObject(value: any) {
    const orchestratorTask: any = _.pick(value, 'startDate', 'name', 'description', 'files', 'type', 'priority', 'assigned', 'finishDate');
    const task: any = _.pick(value, 'order', 'stage', 'labels', 'epic');
    task.board = this.board._id;
    orchestratorTask.type = orchestratorTask.type || this.task.orchestratorTask.type;
    orchestratorTask.state = this.stages?.find(s => s._id === task.stage)?.state;
    task.orchestratorTask = orchestratorTask;
    return task;
  }

  cancel() {
    if (this.isNew) {
      sessionStorage.clear();
      this.task.orchestratorTask.files.forEach(f => {
        this.driveDocumentsService.remove(f._id).subscribe();
      });
    } else {
      this.trimTaskName();
    }
    this.canceled.emit(this.hasTaskChanged);
  }

  assigneeAdded(member: any) {
    this.task.orchestratorTask.assigned.push(member);
    const assignedArray = this.taskForm.get('assigned') as FormArray;
    assignedArray.push(this.fb.control(member._id));
    if (this.isNew) {
      sessionStorage.setItem('assigned', JSON.stringify(this.task.orchestratorTask.assigned));
    }
  }

  assigneeRemoved(member: any) {
    const taskIndex = this.task.orchestratorTask.assigned.findIndex((a: any) => a._id === member._id);
    this.task.orchestratorTask.assigned.splice(taskIndex, 1);
    const assignedArray = this.taskForm.get('assigned') as FormArray;
    assignedArray.removeAt(taskIndex);
    if (this.isNew) {
      sessionStorage.setItem('assigned', JSON.stringify(this.task.orchestratorTask.assigned));
    }
  }

  labelAdded(label: Label) {
    this.task.labels.push(label);
    const labelsArray = this.taskForm.get('labels') as FormArray;
    labelsArray.push(this.fb.control(label._id));
    if (this.isNew) {
      sessionStorage.setItem('labels', JSON.stringify(this.task.labels));
    }
  }

  labelRemoved(label: Label) {
    const labelsArray = this.taskForm.get('labels') as FormArray;
    const taskIndex = this.task.labels.findIndex((a: any) => a._id === label._id);
    this.task.labels.splice(taskIndex, 1);
    labelsArray.removeAt(taskIndex);
    if (this.isNew) {
      sessionStorage.setItem('labels', JSON.stringify(this.task.labels));
    }
  }

  epicAdded(epic: Epic) {
    this.task.epic = epic;
    this.taskForm.get('epic').setValue(epic._id);
    sessionStorage.setItem('epic', JSON.stringify(this.task.epic));
  }

  epicRemoved() {
    this.task.epic = undefined;
    this.taskForm.get('epic').setValue(null);
    sessionStorage.setItem('epic', JSON.stringify({}));
  }

  fileUploaded(file: any) {
    (this.taskForm.get('files') as FormArray).push(this.generateFilesGroup(file));
    this.task.orchestratorTask.files.push(file);
  }

  fileRemoved(file: any) {
    const fileGroups = this.taskForm.get('files') as FormArray;
    const index = (fileGroups.value as any[]).findIndex(g => g._id === file._id);
    fileGroups.removeAt(index);
    this.task.orchestratorTask.files.splice(index, 1);
  }

  removeDueDate() {
    this.isDueDateEnabled = false;
    this.taskForm.get('finishDate').setValue(null);
    this.task.orchestratorTask.finishDate = null;
  }

  public deleteTask(ref: string) {
    if (this.task.reference !== ref) {
      return;
    }
    this.loading = true;

    this.taskService.deleteTask(this.task._id).subscribe(() => {
      // TODO: Add delete event emitter
      this.saved.emit(this.task);
      this.toastr.success('Task deleted');
    });
  }

  watchUpdateChanges() {

    if (this.task.readOnly) {
      return;
    }

    if (this.isNew) {
      this.taskForm.valueChanges.pipe(distinctUntilChanged(),
        debounceTime(100)).subscribe(formValue => {
        formValue.name = formValue?.name?.trim();
        const task = this.buildTaskObject(formValue);
        // Save to session Storage
        sessionStorage.setItem('task', JSON.stringify(task));
      });
    } else {
      this.taskForm.valueChanges.pipe(distinctUntilChanged(),
        debounceTime(100)).subscribe(formValue => {
        formValue.name = formValue.name.trim();
        const task = this.buildTaskObject(formValue);
        if (formValue.name !== '') {
          this.taskService.update(this.params.project, this.task.reference, task)
            .subscribe(() => {}, err => {
              this.toastr.error(err.error.message || 'Could not save the task');
            });
        }
      });
    }
    this.taskForm.updateValueAndValidity();
  }

  ngOnDestroy() {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(s => s.unsubscribe());
    }
  }

  trimTaskName() {
    if (!this.taskForm) {
      return;
    }
    this.taskForm.get('name').patchValue(this.taskForm.get('name').value.trim());
  }

  getTaskComments($event: any) {
    this.commentsCount = $event.length;
    if (!this.taskForm.value.commentsCount) {
      this.taskForm.addControl('commentsCount', new FormControl(this.commentsCount, []));
    } else {
      this.taskForm.get('commentsCount').patchValue(this.commentsCount);
    }
  }

  async getMentions(query: string): Promise<any[]> {
    return (this.mentions || []).filter(({ id, name }) => {
      return id.toLowerCase().includes(query.toLowerCase()) || name.toLowerCase().includes(query.toLowerCase())
    });
  }

  onMentionCreated(mention: { id: string, userId: string }): void {
    const notify = {
      task: this.task,
      users: [mention.userId]
    } as TaskNotify;
    this.subscriptions.push(this.taskService.notify(notify).subscribe(() => {}));
  }

  checkAccess() {
    this.projectsRestService.isAdmin(this.params.project).subscribe((payload: any) => {
      this.isAdmin = payload.admin;
      this.accessType = payload.accessType;
    });
  }

  focusInput(event: any, input: HTMLElement): void {
    event.preventDefault();
    event.stopPropagation();
    input.focus();
  }

  private runFocusTimer(): void {
    const focusTimer = setTimeout(() => {
      this.taskNameInput.nativeElement.focus();
      clearTimeout(focusTimer);
    });
  }
}
