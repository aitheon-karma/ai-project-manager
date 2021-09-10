import {Component, OnInit, Input, ViewChild} from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AuthService } from '@aitheon/core-client';
import { Router } from '@angular/router';
import {
  ProjectTasksRestService,
  ProjectTask,
  ProjectsRestService,
  Label,
  LabelsRestService
} from '@aitheon/project-manager';
import { NgSelectComponent } from '@ng-select/ng-select';
import { TaskModalComponent } from '../../tasks/shared/task-modal/task-modal.component';
import * as _ from 'lodash';
import { ProjectStatus } from '../../shared/constants/enums';

@Component({
  selector: 'ai-backlog-list',
  templateUrl: './backlog-list.component.html',
  styleUrls: ['./backlog-list.component.scss']
})

export class BacklogListComponent implements OnInit {
  @ViewChild('filterLabel') filterLabel: NgSelectComponent;
  @ViewChild('assigneeFilter') assigneeFilter: NgSelectComponent;
  @ViewChild('priorityFilter') priorityFilter: NgSelectComponent;
  @Input() modalRef: BsModalRef;
  @ViewChild(TaskModalComponent) taskModal: TaskModalComponent;

  config = {
    class: 'modal-lg',
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };
  toggle = [true];
  assignees: any = [];
  label: any = [];
  organizationId: string;
  actionDropdown: boolean;
  selectedId: any;
  projectData: any = {};
  mainFilters = {
    status: 'BACKLOG',
    project: '',
    archived: false
  };
  projectId: any;
  boardId: any;
  tasks: any;
  parentTask: any;
  isLoading = false;
  list = [{ name: 'Tasks', array: [], toggle: false, icon: 'icon--tick', bgcolor: '#7e7e7e' },
    { name: 'Stories', array: [], toggle: false, icon: 'icon--bookmark', bgcolor: '#589be9' },
    { name: 'Issues', array: [], toggle: false, icon: 'icon--settings', bgcolor: '#e96058' }];
  subTasks: Array<any>;

  constructor(
    private router: Router,
    private projectTasksRestService: ProjectTasksRestService,
    private projectsService: ProjectsRestService,
    private labelsRestService: LabelsRestService,
    private authService: AuthService
  ) { }

  onActionClick(event, value) {
    if (value.dependents.length > 1) {
      this.selectedId = value._id;
      event.stopPropagation();
      event.preventDefault();
      this.actionDropdown = !this.actionDropdown;
    }
  }

  ngOnInit() {
    this.projectId = (this.router.url).split('/');
    this.projectId = this.projectId[this.projectId.length - 2];
    this.authService.activeOrganization.subscribe((org: any) => {
      this.organizationId = org._id;
    });
    this.mainFilters.project = this.projectId;
    this.setBacklogList(this.mainFilters);
  }

  setBacklogList(filters: any) {
    this.isLoading = true;
    const concatFilters = {...this.mainFilters, ...filters};
    if (this.projectId !== undefined) {
      this.projectsService.getById(this.projectId).subscribe(project => {
        this.projectData['description'] = project.description;
        concatFilters.archived = project.status === ProjectStatus.ARCHIVED;
        this.projectTasksRestService.search(concatFilters, true).subscribe((response: any) => {
          this.tasks = response;
          this.getSubTasks(response);
          this.sortSubtasks();
          this.getProject(this.projectId);
          this.sortListAsPerType(response);
          this.isLoading = false;
        }, (error) => {
          throw new Error('Can not get Backlog List');
        });
      });

    }
  }

  sortSubtasks() {
    this.tasks.forEach(parentTask => {
      parentTask['subTasks'] = [];
      this.subTasks.forEach(subTask => {
        if (parentTask._id === subTask.parent._id) {
          parentTask.subTasks.push(subTask);
        }
      });
    });
  };

  getSubTasks(tasks) {
    this.subTasks = [];
    tasks.forEach(task => {
      if (task.parent) {
        this.subTasks.push(task);
      }
    });
  }

  sortListAsPerType(backloglist) {
    this.list.forEach(element => {
      element.array = [];
    });
    backloglist.forEach(element => {
      switch (element.orchestratorTask.type) {
        case 'TASK':
          this.list[0].array.push(element);
          break;
        case 'STORY':
          this.list[1].array.push(element);
          break;
        case 'ISSUE':
          this.list[2].array.push(element);
          break;
      }
    });
  }

  setPriorityColor(priority) {
    let color: string;

    switch (priority) {
      case 1:
        color = '#67B231';
        break;
      case 2:
        color = '#F5BA06';
        break;
      case 3:
        color = '#FE8100';
        break;
      case 4:
        color = '#E96058';
        break;
    }
    return color;
  }

  openTaskModal(taskDetails: ProjectTask) {
    this.taskModal.show({
      project: taskDetails.project,
      taskReference: taskDetails.reference,
      boardId: taskDetails.board,
      stageId: taskDetails.stage
    });
  }

  getProject(projectId: string) {
    this.projectData['title'] = this.projectData['status'] = 'Backlog';
    const assinersArr = [];
    const createdByArr = [];

    this.labelsRestService.listByProject(projectId).subscribe((labels: Label[]) => {
      this.projectData['labels'] = labels;
    });



    this.tasks.forEach((task: ProjectTask) => {
      assinersArr.push(...task.orchestratorTask.assigned);
      createdByArr.push(task.orchestratorTask.createdBy);
    });

    this.projectData['assignees'] = _.uniqBy(assinersArr, '_id');
    this.projectData['createdBy'] = _.uniqBy(createdByArr, '_id');
  }
}
