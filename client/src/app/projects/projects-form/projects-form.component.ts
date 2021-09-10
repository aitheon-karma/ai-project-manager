import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TasksRestService } from '@aitheon/orchestrator';
import { Project, ProjectsRestService, BoardsRestService } from '@aitheon/project-manager';
import { AuthService } from '@aitheon/core-client';
import * as _ from 'lodash';

@Component({
  selector: 'ai-projects-form',
  templateUrl: './projects-form.component.html',
  styleUrls: ['./projects-form.component.scss']
})
export class ProjectsFormComponent implements OnInit {

  // tslint:disable-next-line:no-output-rename
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onSaved: EventEmitter<Project> = new EventEmitter<Project>();
  @Output() onCancel: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input('project') project: Project;
  @Input('modalRef') modalRef;
  projectForm: FormGroup;
  loading = false;
  submitted = false;
  isNew: boolean;
  maxDate: Date;
  ghostFocus = false;
  currentOrganization: any;
  displayMenu = false;
  issueBordLabel = 'Disabled';
  nameMask = /^[^\s][a-zA-Z0-9_ ]+([\s-\/]+[a-zA-Z0-9\s]+)*$/;

  AccessList = [
    {
      icon: 'icon--globus',
      title: 'PUBLIC',
      description: 'Anyone with access to organization can create and edit issues.'
    },
    // {
    //   icon: 'icon--group',
    //   title: 'Team',
    //   description: 'Only invited team can edit and view this project.'
    // },
    {
      icon: 'icon--lock',
      title: 'PRIVATE',
      description: 'Only people added to the project can create and edit issues.'
    }
  ];

  workspaces = [
    {
      title: 'Kanban',
      description: 'A Kanban board is a work and workflow visualization tool that enables you to optimize the flow of your work',
      style: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, rgb(43, 43, 43) 100%), url(\'assets/tile_pattern_1.png\')'
    },
    {
      title: 'Gantt',
      // tslint:disable-next-line:max-line-length
      description: 'Gantt chart provides a graphical illustration of a schedule that helps to plan, coordinate, and track specific tasks in a project. ',
      style: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, rgb(43, 43, 43) 100%),url(\'assets/tile_pattern_2.png\')'
    },
    {
      title: 'Mindmap',
      // tslint:disable-next-line:max-line-length
      description: 'It is a visual thinking tool that helps structuring information, helping you to better analyze, comprehend, synthesize and recall',
      style: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, rgb(43, 43, 43) 100%),url(\'assets/tile_pattern_3.png\')'
    }
  ];

  priorityList = [];
  projectId: string;
  selectedWorkapces: any = [
    {
      title: 'Kanban',
      description: 'A Kanban board is a work and workflow visualization tool that enables you to optimize the flow of your work',
      style: 'linear-gradient(90deg, rgba(26, 26, 26, 0.8) 0%, rgb(43, 43, 43) 100%), url(\'assets/tile_pattern_1.png\')'
    }
  ];
  textValidation: boolean;
  tempArray: any[] = [];
  constructor(
    private projectsRestService: ProjectsRestService,
    private boardRestService: BoardsRestService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private router: Router,
    private taskService: TasksRestService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.authService.activeOrganization.subscribe(org => {
      this.currentOrganization = org;
    });
    this.fillPriority();
    if (this.project) {
      this.isNew = false;
      this.buildForm(this.project);
      this.loading = false;
    } else {
      this.isNew = true;
      this.project = new Project();
      this.buildForm(this.selectedWorkapces);
    }
  }

  buildForm(project: Project) {
    this.projectForm = new FormGroup({
      name: new FormControl(project.name, [Validators.required, Validators.maxLength(30), Validators.pattern(this.nameMask)]),
      description: new FormControl(project.description),
      type: new FormControl(this.AccessList[0].title, [Validators.required]),
      priority: new FormControl(this.priorityList[5].priority, [Validators.required]),
      key: new FormControl('', [Validators.required, Validators.maxLength(3), Validators.pattern('[a-zA-Z]+')]),
      issueBoardEnabled: new FormControl(false),
      workspaces: new FormControl(this.workspaces)
    });
  }

  selectedWorkspace(workspace) {
    if (!this.tempArray.includes(workspace.title)) {
      this.selectedWorkapces.push(workspace);
      this.tempArray.push(workspace.title);
    } else {
      this.removeFromArray(workspace);
    }
  }

  onSubmit() {
    this.submitted = true;

    if (this.projectForm.invalid || this.textValidation) {
      return;
    }

    if (this.selectedWorkapces.length === 0) {
      this.toastr.error('Select atleast one workspace');
      return;
    }

    const project = Object.assign({}, this.project, this.projectForm.value);

    if (this.project) {
      project['_id'] = this.project._id;
    }

    this.selectedWorkapces.forEach((element, index) => {
      this.projectForm.value.workspaces[index] = {
        title: element.title,
        description: element.description
      };
    });
      this.loading = true;
      this.projectsRestService.create(project).subscribe((e: Project) => {
          this.submitted = false;
          this.project = e;
          this.isNew = false;
          this.onSaved.emit(this.project);
          this.toastr.success('Project created');
          this.loading = false;
      }, (err) => {
        this.submitted = false;
        this.loading = false;
        this.toastr.error(err.error.message || 'Can`t create Project');
      });

  }

  removeFromArray(workspace) {
    _.remove(this.workspaces, function (n: any) {
      return n._id === workspace.title;
    });
    _.remove(this.tempArray, function (n: any) {
      return n === workspace.title;
    });
  }

  get workspace() {
    return this.projectForm.get('workspace') as FormArray;
  }

  varifyTaskNameValue(event) {
    this.textValidation = !this.projectForm.get('name').value.trim();
  }

  cancel() {
    this.modalRef.hide();
    this.router.navigateByUrl('/projects');
    this.onCancel.emit(true);
  }

  navigateTo(workSpace) {
    this.toastr.error('You are not authorized');

    if (workSpace.length === 0) {
      this.router.navigateByUrl('projects');
    }

    switch (workSpace) {
      case 'Kanban':
        this.router.navigateByUrl(`projects/${this.projectId}/boards`);
        break;
      case 'Gantt':
        this.router.navigateByUrl(`projects/${this.projectId}/gantt-chart`);
        break;
      case 'Mindmap':
        this.router.navigateByUrl(`projects/${this.projectId}/mindmap`);
        break;
    }
  }

  fillPriority() {
    for (let i = 0; i <= 10; i++) {
      let title = '';
      switch (i) {
        case 0:
          title = `${i} - Lowest`;
          break;
        case 2:
          title = `${i} - Low`;
          break;
        case 5:
          title = `${i} - Medium`;
          break;
        case 8:
          title = `${i} - High`;
          break;
        case 10:
          title = `${i} - Highest`;
          break;
        default:
          title = i.toString();
          break;
      }

      this.priorityList.push({
        title,
        priority: i
      });
    }
  }

  focusInput(event: any, input: HTMLElement): void {
    event.preventDefault();
    event.stopPropagation();
    input.focus();
  }
}
