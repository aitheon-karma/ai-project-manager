import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { ProjectsRestService, ProjectTask } from '@aitheon/project-manager';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { TaskModalComponent } from '../../tasks/shared/task-modal/task-modal.component';
import { NgSelectComponent } from '@ng-select/ng-select';

export type FadeState = 'visible' | 'hidden';
@Component({
  selector: 'ai-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  animations: [
    trigger('state', [
      state(
        'visible',
        style({
          opacity: '1',
          position: 'relative',
          top: '0'
        })
      ),
      state(
        'hidden',
        style({
          opacity: '0',
        })
      ),
      transition('* => visible', [animate('300ms ease-out')]),
      transition('visible => hidden', [animate('300ms ease-out')])
    ])
  ]
})

export class GlobalSearchComponent implements OnInit {

  @Input() set show(value: boolean) {
    if (value) {
      this.hideResults = false;
      this._show = value;
      this.state = 'visible';

      let focus = setTimeout(()=>{
        this.search.nativeElement.focus();
        clearTimeout(focus);
      });

    } else {
      this.state = 'hidden';
    }
  }
  state: FadeState;
  private _show: boolean;

  get show() {
    return this._show;
  }

  animationDone(event: AnimationEvent) {
    if (event.fromState === 'visible' && event.toState === 'hidden') {
      this._show = false;
    }
  }

  @Output() closeSearch: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('search') search: ElementRef;
  @ViewChild(TaskModalComponent) taskModal: TaskModalComponent;
  @ViewChild('assigneeFilter') assigneeFilter: NgSelectComponent;
  @ViewChild('filterLabel') filterLabel: NgSelectComponent;
  @ViewChild('taskTypesFilter') taskTypesFilter: NgSelectComponent;
  @ViewChild('taskPropertiesFilter') taskPropertiesFilter: NgSelectComponent;
  @ViewChild('createdByFilter') createdByFilter: NgSelectComponent;
  @ViewChild('projectsFilter') projectsFilter: NgSelectComponent;

  searchForm: FormGroup;
  searchText: FormControl;
  tasks: any[] = [];
  archivedTasks: any[] = [];
  loading: boolean = false;
  showFilters: boolean = true;
  sortOptions = { latest: { 'createdAt' : -1 }, oldest: { 'createdAt' : 1 }, modified: { 'updatedAt' : -1 },
                  higher: {'orchestratorTask.priority': 1}, lower: {'orchestratorTask.priority': -1}};
  priorities = [{name: 'Highest', value: 4}, {name: 'High', value: 3}, {name: 'Medium', value: 2},{name: 'Low', value: 1}];
  types = [{label: 'Task',value: 'TASK'}, {label: 'Issue', value: 'ISSUE'}, {label: 'Story', value: 'STORY'}];
  assignees: any[] = [];
  labels: any[] = [];
  createdBy: any[] = [];
  filters: any[] = [];
  activeFilters: number;
  searchedForm: any;
  text: string = '';
  finalForm: any;
  avatarColors = ['#E96058', '#ED9438', '#F5BA06', '#67B231', '#1AC0C9', '#589BE9', '#6278C4', '#8C58E9', '#CA58E9', '#F39ABA'];
  projects: any[];
  hideResults: boolean = true;

  constructor(private fb: FormBuilder,
              private projectsService: ProjectsRestService) {}

  ngOnInit() {
    this.projectsService.search().subscribe(res => {
      this.getFiltersData(res);
    });
    this.getProjects();
    this.buildSearchForm();
  }

  getProjects() {
    this.projectsService.list().subscribe(res => {
      this.projects = res;
    })
  }

  buildSearchForm() {
    this.searchText = new FormControl(null);

    this.searchForm = this.fb.group({
      sort: null,
      priorities: '',
      assignees: '',
      labels: '',
      projects: '',
      createdBy: '',
      types: ''
    });

    this.searchText.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe((res) => {

      if (res.length > 1 || this.activeFilters > 0) {
        this.getSearchData(res, this.filters);
      }

      if (!res.length && this.activeFilters == 0) {

        this.projectsService.search().subscribe(res => {
          this.getFiltersData(res);
        });
      }
    });

    this.searchForm.valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((form) => {
      this.filters = form;
      this.getSearchData(this.text, form);
    })
  }

  getSearchData(text: any, form: any) {
    if (!form) return;

    if (form || this.searchText.value.length > 1) {
      this.loading = true;
    }

    if (form.sort && typeof form.sort == 'string') {
      form.sort = JSON.parse(form.sort);
    }

    this.text = text;

    this.finalForm = {
      searchText: this.text,
      ...form
    }

    this.projectsService.search(this.finalForm, true).subscribe(res => {
      this.tasks = [];
      this.archivedTasks = [];

      res.forEach( task => {
        if (task.archived) {
          this.archivedTasks.push(task);
        } else {
          this.tasks.push(task);
        }
      });

      this.calcActiveFilters(form);
      this.loading = false;

      this.getFiltersData(this.tasks, this.archivedTasks);
    });
  }

  onCloseSearch() {
    this.hideResults = true;
    this.searchText.setValue('');
    this.clearFilters();
    this.closeSearch.emit(true);
  }

  resetSelect(type: any, elementRef: any) {
    this.searchForm.get(type).setValue([]);
    elementRef.close();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  getFiltersData(tasks: any[], archivedTasks: any[] = []) {

    const arr = [...tasks, ...archivedTasks];

    this.assignees = arr.reduce((acc,task)=>{
      const result = [];
      if (task.orchestratorTask.assigned) {
        for (const assignee of task.orchestratorTask.assigned) {
          if (!acc.find(({_id})=> _id === assignee._id)) {
            result.push({
              ...assignee,
              name: assignee.profile.firstName + ' ' + assignee.profile.lastName
            });
          }
        }
      }
      return [...acc, ...result];
    }, []);

    this.labels = arr.reduce((acc,task)=>{
      const result = [];
      if (task.labels) {
        for (const label of task.labels) {
          if (!acc.find(({_id})=> _id === label._id)) {
            result.push(label);
          }
        }
      }
      return [...acc, ...result];
    }, []);

    this.createdBy = arr.reduce((acc,task)=>{
      const result = [];
      if (task.orchestratorTask.createdBy) {
        if (!acc.find(({_id})=> _id === task.orchestratorTask.createdBy._id)) {
          result.push({
            ...task.orchestratorTask.createdBy,
            name: task.orchestratorTask.createdBy.profile.firstName + ' ' + task.orchestratorTask.createdBy.profile.lastName
          });
        }
      }
      return [...acc, ...result];
    }, []);
  }

  calcActiveFilters(form) {
    this.activeFilters = 0;

    const values = Object.values(form);

    values.shift();

    values.forEach((value: any | null) => {
      if (value && Array.isArray(value)) {
        value.forEach((v: Array<any> | null) => {
          this.activeFilters++;
        });
      }
    });
  }

  openTaskModal(taskDetails: ProjectTask) {
    this.taskModal.show({
      project: taskDetails.project,
      taskReference: taskDetails.reference,
      boardId: taskDetails.board,
      stageId: taskDetails.stage
    });
  }

  getPriorityTooltip(priority: number) {
    let result = '';
    if (priority == 1) {
      result = 'Low'
    } else if (priority == 2) {
      result = 'Medium'
    } else if (priority == 3) {
      result = 'High'
    } else if (priority == 4) {
      result = 'Highest'
    }
    return result;
  }

  getOtherLabels(labels: Array<any>) {
    let array = labels.slice(3);
    let editedLabels = '<div class="chip-labels__container">';

    array.forEach(label => {
      editedLabels = editedLabels + '<span class="task__chip-label--tooltip chip-label chip--selected '+ label.color +'-chip m--4">' + label.name + '</span>';
    });

    editedLabels = editedLabels + '</div>';

    return editedLabels;
  }

  highlightText(text: any ) {
    let reg = new RegExp(this.searchText.value, 'gi');
    let textWithNonBreakingSpaces = text.replace(/\s/g, '&nbsp;');
    let highlight = textWithNonBreakingSpaces.replace(reg, (str)=>{
      return str ? '<span style="color: #dcbc65">' + str + '</span>' : '';
    });

    return highlight;
  }

  getRandomColor(index: number) {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getInitials(name) {
    return ((name).substr(0, 2)).toUpperCase();
  }

  getOtherAssignees(members: any) {
    let arr = [];
    members.slice(5).forEach((member: any) => {
      const fullName = member.profile.firstName + ' ' + member.profile.lastName;
      arr.push(fullName);
    });
    let editedArr = arr.join(', ');
    return editedArr
  }

  clearFilters() {
    this.activeFilters = 0;
    this.filterLabel.clearModel();
    this.assigneeFilter.clearModel();
    this.createdByFilter.clearModel();
    this.taskTypesFilter.clearModel();
    this.taskPropertiesFilter.clearModel();
    this.projectsFilter.clearModel();

    this.getFiltersData([]);
  }
}
