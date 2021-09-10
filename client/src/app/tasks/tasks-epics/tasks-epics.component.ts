import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, TemplateRef } from '@angular/core';
import { ProjectTask, Epic, EpicsRestService } from '@aitheon/project-manager';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { EpicFormComponent } from '../../shared/components/epic-form/epic-form.component';
import { TaskModalService } from '../shared/task-modal.service';

@Component({
  selector: 'ai-tasks-epics',
  templateUrl: './tasks-epics.component.html',
  styleUrls: ['./tasks-epics.component.scss']
})
export class TasksEpicsComponent implements OnInit {
  @ViewChild('epicModal') epicModal: TemplateRef<any>;
  @ViewChild('searchElement') searchElement: ElementRef;
  @Input() task: ProjectTask;
  @Input() projectId: string;
  @Input() taskReadonly: boolean;
  @Output() epicAdded = new EventEmitter<Epic>();
  @Output() epicRemoved = new EventEmitter<Epic>();

  selectedEpic: Epic;
  epics: Epic[];
  searchResults: Epic[] = [];
  searchFocused: boolean;
  showSearch = false;
  searchControl: FormControl;
  epicModalRef: BsModalRef;

  constructor(private epicsRestService: EpicsRestService,
              private taskModalService: TaskModalService,
              private modalService: BsModalService) { }

  ngOnInit() {
    this.searchControl = new FormControl();
    this.initializeSearch();
    this.selectedEpic = this.task.epic;
    this.getEpics();
  }

  private initializeSearch() {
    this.searchControl.valueChanges
    .pipe(debounceTime(200),
      distinctUntilChanged(),
      filter(val => val.trim().length > 1),
      switchMap(text => this.epicsRestService.list(undefined, text.trim(), false)))
    .subscribe((epics: Epic[]) => {
      this.parseEpics(epics);
    });
  }

  getEpics(epic?: any) {
    this.epicsRestService.list(undefined, '', false).subscribe((epics: Epic[]) => {
      this.parseEpics(epics);
    });
    if (epic) {
      this.closeEpicModal();
    }
  }

  parseEpics(epics: Epic[]) {
    this.epics = epics;
    if (this.selectedEpic) {
      this.epics = this.epics.filter((epic: Epic) => {
        return epic._id !== this.selectedEpic._id;
      });
    }
  }

  showSearchAndFocus(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showSearch = true;
    setTimeout(() =>  this.searchElement.nativeElement.focus(), 0 );
  }

  hideSearch() {
    setTimeout(() => { this.showSearch = false; this.searchControl.setValue(''); this.getEpics(); }, 200);
  }

  add(epic: Epic) {
    this.epicAdded.emit(epic);
    this.searchControl.setValue('');
  }

  removeEpic() {
    this.epicRemoved.emit();
    this.selectedEpic = this.task.epic;
  }

  setEpic(epic: Epic) {
    this.selectedEpic = epic;
    this.add(epic);
  }

  openEpicForm() {
    this.epicModalRef = this.modalService.show(this.epicModal, { backdrop: 'static', ignoreBackdropClick: true });
    this.taskModalService.taskFormViewStatus$.next(false);
  }

  closeEpicModal() {
    this.epicModalRef.hide();
    this.taskModalService.taskFormViewStatus$.next(true);
  }

  createEpic(epicFormComponent: EpicFormComponent) {
    epicFormComponent.onSubmit();
  }
}

