import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ProjectTask, LabelsRestService, Label } from '@aitheon/project-manager';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TaskModalService } from '../shared/task-modal.service';

@Component({
  selector: 'ai-task-labels',
  templateUrl: './task-labels.component.html',
  styleUrls: ['./task-labels.component.scss']
})
export class TaskLabelsComponent implements OnInit {

  @Input() task: ProjectTask;
  @Input() projectId: string;
  @Input() taskReadonly: boolean;
  @Input() isAdmin: boolean;
  @ViewChild('searchElement') searchElement: ElementRef;
  @ViewChild('createLabelForm') createLabelForm: ElementRef;
  @Output() labelAdded = new EventEmitter<Label>();
  @Output() labelRemoved = new EventEmitter<Label>();

  selectedLabels: Label[] = [];
  labels: Label[];
  searchResults: Label[] = [];
  searchFocused: boolean;
  showSearch = false;
  searchControl: FormControl;
  labelToEdit: Label;
  isLabelToEdit = false;
  actionDropdown = false;
  labelFormModalRef: BsModalRef;
  allLabels: Label[] = [];

  constructor(private labelsService: LabelsRestService,
              private taskModalService: TaskModalService,
              private modalService: BsModalService) { }

  ngOnInit() {
    this.searchControl = new FormControl();
    this.initializeSearch();
    this.selectedLabels = this.task.labels;
  }

  private initializeSearch() {
    this.labelsService.listByProject(this.projectId).subscribe((labels: Label[]) => {
      this.labels = labels;
      this.filterLabels(labels);
    });
    this.searchControl.valueChanges
    .pipe(debounceTime(350),
      distinctUntilChanged(),
      switchMap(text => this.labelsService.listByProject(this.projectId, text.trim())))
    .subscribe((labels: Label[]) => {
      this.filterLabels(labels);
    });
  }

  filterLabels(labels: Label[]) {
    const selectedIds = this.selectedLabels.map((label: Label) => {
      return label._id;
    });
    this.labels = labels.filter((label: Label) => {
      return selectedIds.indexOf(label._id) < 0;
    });
  }

  showSearchAndFocus(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.showSearch = !this.showSearch;
    
    if (this.showSearch) {
      const timeOut = setTimeout(() => {
        this.searchElement.nativeElement.focus();
        clearTimeout(timeOut);
      });
    }
  }

  hideSearch() {
    this.showSearch = false;
    this.searchControl.setValue('');
  }

  add(label: Label) {
    this.labelAdded.emit(label);
    this.searchControl.setValue('');
    this.searchResults = [];
  }

  remove(label: Label) {
    this.labelRemoved.emit(label);
    this.selectedLabels = this.task.labels;
    this.labels.push(label);
    this.filterLabels(this.labels);
  }

  setLabel(label: Label) {
    this.selectedLabels = [...this.selectedLabels, label];
    this.add(label);
    this.filterLabels(this.labels);
  }

  onLabelRemove(label: Label, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.remove(label);
  }

  openCreateLabelModal() {
    this.actionDropdown = false;
    this.labelToEdit = undefined;
    this.labelFormModalRef = this.modalService.show(this.createLabelForm, {ignoreBackdropClick: true});
    this.taskModalService.taskFormViewStatus$.next(false);
  }

  stopEvents(e: Event) {
    e.stopPropagation();
    e.preventDefault();
  }
}
