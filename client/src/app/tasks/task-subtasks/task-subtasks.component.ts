import { Component, OnInit, Input, OnChanges, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { Stage, Board, ProjectTask, ProjectTasksRestService } from '@aitheon/project-manager';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskModalService } from '../shared/task-modal.service';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { TaskType} from 'src/app/shared/constants/enums';
import { TaskParams } from '../shared/models/task-params.interface';


/* This component handles the list and the form, should be refactored if we add more features */

@Component({
  selector: 'ai-task-subtasks',
  templateUrl: './task-subtasks.component.html',
  styleUrls: ['./task-subtasks.component.scss']
})
export class TaskSubtasksComponent implements OnInit, OnChanges {

  constructor(private fb: FormBuilder,
    private taskModalService: TaskModalService,
    private toastr: ToastrService,
    private projectTasksService: ProjectTasksRestService) { }

  @Input() board: Board;
  @Input() parentTask: ProjectTask;
  @Input() createMode: boolean;
  @Input() taskReadonly: boolean;
  @Input() stages: any;
  @ViewChild('name') name: ElementRef;
  submitted = false;
  subTaskForm: FormGroup;
  loadingForm = false;
  subTaskList: ProjectTask[];

  ngOnInit() {
    this.getSubTasks();
  }

  private getSubTasks() {
    this.projectTasksService
      .listByParent(this.parentTask.project, this.parentTask._id, this.parentTask.epic ? true : undefined, true)
      .subscribe(subTasks => {
        this.subTaskList = subTasks;
        this.loadingForm = false;
      });
  }

  private buildForm() {
    this.subTaskForm = this.fb.group({
      name: this.fb.control('', [Validators.required]),
      stage: this.fb.control(this.board.stages[0]._id, [Validators.required]),
      priority: this.fb.control(2),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.buildForm();
    // console.log(changes);

    if (this.createMode) {
      setTimeout(()=>{
        this.name.nativeElement.focus();
      }, 0)
    }
  }

  cancel() {
    this.taskModalService.changeStatus(false);
  }

  addSubTask() {
    this.taskModalService.changeStatus(true);
  }

  onSubmit() {
    this.submitted = true;
    this.subTaskForm.get('name').setValue(this.subTaskForm.value.name.trim());
    if (this.subTaskForm.invalid) {
      return;
    }
    const task = this.buildTaskObject(this.subTaskForm.value);
    this.loadingForm = true;
    this.projectTasksService.create(this.parentTask.project, task)
    .subscribe(createdTask => {
      this.subTaskForm.get('name').setValue('');
      this.submitted = false;
      this.taskModalService.addSavedTask(createdTask);
      this.getSubTasks();
    }, () => {
      this.toastr.error('Something went wrong in subtasks');
    });
  }

  private buildTaskObject(value: any) {
    const orchestratorTask: any = _.pick(value, 'name', 'type', 'priority');
    const task: any = _.pick(value, 'order', 'stage');
    task.board = this.board._id;
    task.parent = this.parentTask._id;
    orchestratorTask.state = this.board.stages.find(s => s._id === task.stage).state;
    orchestratorTask.startDate = new Date();
    orchestratorTask.parentTask = this.parentTask.orchestratorTask._id;
    orchestratorTask.type = this.parentTask.orchestratorTask.type === TaskType.STORY ?
                TaskType.TASK : this.parentTask.orchestratorTask.type;
    task.orchestratorTask = orchestratorTask;
    return task;
  }

  changeTask(task: ProjectTask) {
    const params: TaskParams = {
      taskReference: task.reference,
      project: task.project,
      boardId: task.board._id || task.board,
      parentReference: this.parentTask.reference
    };
    this.taskModalService.changeTask(params);
  }

  getIconClass(subtask: ProjectTask) {
    let icon: string, backgroundColor: string;
    switch (subtask.orchestratorTask.type) {
      case TaskType.TASK: { icon = 'icon--tick'; backgroundColor = 'subtask-type__task'; break; }
      case TaskType.STORY: { icon = 'icon--bookmark'; backgroundColor = 'subtask-type__story'; break; }
      case TaskType.ISSUE: { icon = 'icon--settings'; backgroundColor = 'subtask-type__issue'; break; }
    }
    return [backgroundColor, icon];
  }

}
