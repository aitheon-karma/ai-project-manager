import { NgSelectComponent } from '@ng-select/ng-select';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Epic, ProjectsRestService } from '@aitheon/project-manager';
import { Subject, Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';

import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'ai-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.scss'],

})
export class FiltersPanelComponent implements OnInit, OnChanges, OnDestroy {

  @Input() projectData: any;
  @Input() projectStatus: any;
  @Input() projectId: string;
  @Input() epic: Epic;
  @Input() resetFormSubject: Subject<boolean> = new Subject<boolean>();
  @Output() epicForModal = new EventEmitter<Epic>();
  @Output() removeEpic = new EventEmitter<Epic>();
  @Output() resetFilters: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() filterData: EventEmitter<any> = new EventEmitter<any>();
  @Output() openModal: EventEmitter<any> = new EventEmitter<any>();
  @Output() toggleFiltersEvent: EventEmitter<any> = new EventEmitter<boolean>();
  @ViewChild('assigneeFilter') assigneeFilter: NgSelectComponent;
  @ViewChild('taskLabelFilter') taskLabelFilter: NgSelectComponent;
  @ViewChild('taskTypesFilter') taskTypesFilter: NgSelectComponent;
  @ViewChild('taskPriorityFilter') taskPriorityFilter: NgSelectComponent;
  @ViewChild('createdByFilter') createdByFilter: NgSelectComponent;

  searchForm: FormGroup;
  isFiltersOpen = false;
  types = [{name: 'Task', value: 'TASK'}, {name: 'Story', value: 'STORY'}, {name: 'Issue', value: 'ISSUE'}];
  priorities = [{name: 'Highest', value: 4}, {name: 'High', value: 3 }, {name: 'Medium', value: 2 }, {name: 'Low', value: 1 }];
  showMore = false;
  activeFilters: number;
  formToCountFilters: any;
  searchAssigneesControl: FormControl;
  assigneesList: any;
  originAssigneesList: any;
  assigneesSelectedCount: number;
  assigneesUnselectedCount: number;
  taskLabels: Array<any> = [];
  selectedLabelsNumber: number;
  unselectedLabelsNumber: number;
  isAdmin = false;
  accessType: string;
  boardDataRefreshing = false;
  subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private projectsRestService: ProjectsRestService,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    public router: Router,
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.searchAssigneesControl = new FormControl();
    this.initializeAssigneesSearch();
    this.buildForm();

    this.subscriptions.push(this.sharedService.viewBoardDataRefreshing.subscribe(status => {
      this.boardDataRefreshing = status;
    }));

    this.subscriptions.push(this.sharedService.viewFiltersData.subscribe(filtersData => {
      this.refreshFiltersData(filtersData);
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refreshFiltersData(this.projectData);
    if (this.projectId) {
      this.checkAccess();
    }
  }

  checkAccess() {
    this.subscriptions.push(this.projectsRestService.isAdmin(this.projectId).subscribe((payload: any) => {
      this.isAdmin = payload.admin;
      this.accessType = payload.accessType;
      this.cdr.detectChanges();
    }));
  }

  resetSelect(type: any, elementRef: any) {
    this.searchForm.get(type).setValue([]);
    elementRef.close();
  }

  clearSearch() {
    this.searchForm.get('searchText').patchValue('');
  }

  buildForm() {
    this.searchForm = this.fb.group({
      searchText: [''],
      assignees: [[]],
      labels: [],
      types: [],
      priorities: [],
      createdBy: [],
      projects: []
    });

    this.subscriptions.push(this.searchForm.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((form: any) => {
        this.filterData.emit(form);
        this.formToCountFilters = form;
        this.calcActiveFilters(form);
        this.assigneesList = this.originAssigneesList;
        this.searchAssigneesControl.patchValue('');
        this.setStatusToAssignee();
        this.taskLabels = this.getSortedLabels([...this.taskLabelFilter.items]);
      }));
  }

  private setStatusToAssignee() {
    const selectedUsers = this.searchForm.get('assignees').value || [];
    if (selectedUsers && this.assigneesList) {
      if (selectedUsers.length !== 0) {
        this.assigneesList.map(user => {
          user.status = 'unselected';
        });
        selectedUsers.forEach(id => {
          this.assigneesList.find(user => {
            if (user._id === id) {
              return user.status = 'selected';
            }
          });
        });
      }
      if (selectedUsers.length === 0) {
        this.assigneesList.map(user => {
          user.status = undefined;
        });
      }
      this.originAssigneesList = [...this.assigneesList];
      this.assigneesList = [...this.originAssigneesList].sort(this.sortOptions);
      this.countAssignees();
    }
  }

  clearFilters() {
    this.activeFilters = 0;
    this.taskLabelFilter.clearModel();
    this.assigneeFilter.clearModel();
    this.createdByFilter.clearModel();
    this.searchForm.reset();
    this.resetFilters.emit(true);
  }

  onOpenEditStageModal() {
    this.openModal.emit({});
  }

  toggleFilters() {
    this.isFiltersOpen = !this.isFiltersOpen;
    this.showMore = false;

    setTimeout(() => {
      this.toggleFiltersEvent.emit();
    }, 10);
  }

  toggleMoreSection() {
    this.showMore = !this.showMore;
  }

  openEpicForm(epic: Epic, e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.epicForModal.emit(epic);
    this.showMore = false;
  }

  onRemoveEpic(epic: Epic, e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.removeEpic.emit(epic);
    this.showMore = false;
  }

  calcActiveFilters(form) {
    this.activeFilters = 0;
    const values = Object.values(form);

    values.shift();

    values.forEach((value: any | null) => {
      if (value) {
        value.forEach((v: Array<any> | null) => {
          this.activeFilters++;
        });
      }
    });
  }

  private initializeAssigneesSearch() {
    this.subscriptions.push(this.searchAssigneesControl.valueChanges
      .pipe(debounceTime(100),
        distinctUntilChanged(),
        filter(val => val.trim().length))
      .subscribe((res: any) => {
        if (res.length > 1) {
          this.searchAssignee(res);
        } else {
          this.assigneesList = this.originAssigneesList;
        }
      }));
  }

  searchAssignee(text: string) {
    this.assigneesList = this.originAssigneesList;
    this.assigneesList = this.assigneesList.filter((name: any) => {
      return (name.profile.lastName.toLowerCase().includes(text.toLowerCase()) ||
        name.profile.firstName.toLowerCase().includes(text.toLowerCase()));
    });
  }

  countAssignees() {
    this.assigneesSelectedCount = 0;
    this.assigneesUnselectedCount = 0;
    this.assigneesList.forEach(user => {
      if (user.status === 'selected') {
        this.assigneesSelectedCount += 1;
      }
      if (user.status === 'unselected') {
        this.assigneesUnselectedCount += 1;
      }
    });
  }

  onDropdownOptionsChange(event, filterType: string): void {
    const allItems = this[filterType].items;
    const selectedItems = event;

    this.setStatusToItems(selectedItems, allItems);
    this.countSelectedItems(filterType);
  }

  private setStatusToItems(selectedItems: Array<any>, allItems: Array<any>): void {
    allItems.forEach(item => {
      const isAnyItemSelected = (selectedItems.length > 0);

      if (isAnyItemSelected) {
        const isItemSelected = this.isItemSelected(item, selectedItems);
        item.status = isItemSelected ? 'selected' : 'unselected';
      } else {
        item.status = undefined;
      }
    });
  }

  private isItemSelected(item, selectedItems): boolean {
    return selectedItems.some(selectedItem => selectedItem._id === item._id);
  }

  private countSelectedItems(filterType: string): void {
    if (filterType === 'taskLabelFilter') {
      this.selectedLabelsNumber = this.taskLabelFilter.selectedItems.length;
      this.unselectedLabelsNumber = this.taskLabelFilter.items.length - this.taskLabelFilter.selectedItems.length;
    }
  }

  private getSortedLabels(labels: Array<any>): Array<any> {
    return labels.sort(this.sortOptions);
  }

  private sortOptions(firstOption, secondOption): number {
    const isOnlyFirstOptionSelected = (firstOption.status === 'selected' && secondOption.status === 'unselected');
    const isOnlySecondOptionSelected = (firstOption.status === 'unselected' && secondOption.status === 'selected');
    const isAssignees = firstOption.profile && secondOption.profile;

    const firstItemToCompare = isAssignees ? firstOption.profile.firstName.toLowerCase() : firstOption.name.toLowerCase();
    const secondItemToCompare = isAssignees ? secondOption.profile.firstName.toLowerCase() : secondOption.name.toLowerCase();

    if (isOnlyFirstOptionSelected) {
      return -1;
    } else if (isOnlySecondOptionSelected) {
      return 1;
    } else {
      return (firstItemToCompare < secondItemToCompare) ? -1 : 1;
    }
  }

  ngOnDestroy() {
    if (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
  }

  closeMoreSection() {
    if (this.showMore === true) { this.showMore = false; }
  }

  private refreshFiltersData(data) {
    if (data.assignees) {
      this.assigneesList = this.originAssigneesList = data.assignees;
      this.setStatusToAssignee();
    }
    if (data.labels && !this.taskLabelFilter.items.length) {
      this.taskLabels = data.labels;
    }
  }
}
