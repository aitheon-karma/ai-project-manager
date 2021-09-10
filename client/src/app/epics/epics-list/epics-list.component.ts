import { Component, OnInit, TemplateRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { EpicFormComponent } from '../../shared/components/epic-form/epic-form.component';
import { EpicsRestService, Epic } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { GenericConfirmComponent } from 'src/app/shared/components/generic-confirm/generic-confirm.component';
import { EpicStatus } from '../../shared/constants/enums';
import { PlatformLocation } from '@angular/common';

@Component({
  selector: 'ai-epics-list',
  templateUrl: './epics-list.component.html',
  styleUrls: ['./epics-list.component.scss']
})
export class EpicsListComponent implements OnInit, OnChanges {

  @ViewChild('epicModal') epicModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @Input() status: any;

  epicsList = [];
  epic: Epic;
  isSubmitted = false;
  epicModalRef: BsModalRef;
  isNew = false;
  percentage: number;
  loading: any = true;
  epicsStatus: any;
  formDirty: boolean = false;
  modalIsOpen: boolean = false;
  genericIsOpen: boolean = false;
  disableButton: boolean;

  constructor(private modalService: BsModalService,
              private epicsRestService: EpicsRestService,
              private toastrService: ToastrService,
              private location: PlatformLocation) {
              }

  ngOnInit() {
    if (this.status === 'EPICS') {
      this.epicsStatus = EpicStatus.ACTIVE;
    } else if (this.status === 'ARCHIVED_EPICS') {
      this.epicsStatus = EpicStatus.ARCHIVED;
    }
    this.getEpicsList(this.epicsStatus);
    this.onLocationChange();
  }

  onLocationChange() {
    this.location.onPopState(() => {
      if (this.modalIsOpen) {
        this.epicModalRef.hide();
        history.go(1);
      } else if (this.genericIsOpen) {
        this.genericConfirm.hide();
        history.go(1);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.status) {
      this.epicsStatus = changes.status.currentValue === 'EPICS' ? 'ACTIVE' : 'ARCHIVED';
      this.getEpicsList(this.epicsStatus);
    }
  }

  getEpicsList(status: any) {
    this.loading = true;
    this.epicsRestService.list(status).subscribe(res => {
      this.epicsList = res;
      this.epicsList.map(epic => {
        epic['moreBtnOpen'] = false;
      });
      this.loading = false;
    });
  }

  openEpicForm(epic?: Epic) {
    this.epic = epic;
    this.epicModalRef = this.modalService.show(this.epicModal, { backdrop: 'static' });
    this.modalIsOpen = true;
  }

  closeEpicModal() {
    if (!this.epicModalRef) {
      return;
    }
    this.epicModalRef.hide();
    this.modalIsOpen = false;
    this.formDirty = false;
  }

  createEpic(epicFormComponent: EpicFormComponent) {
    epicFormComponent.onSubmit();
  }

  updateEpic(epicFormComponent: EpicFormComponent) {
    epicFormComponent.onSubmit(this.epic);
    this.getEpicsList(this.epicsStatus);
  }

  getEpics(e: Epic) {
    if (!this.epic) {
      this.epicsList = [...this.epicsList, e];
    } else {
      this.epicsList = this.epicsList.map(epic => {
        if (epic._id === e._id) {
          return e;
        }
        return epic;
      });
    }
    this.closeEpicModal();
  }

  cangeEpicStatus(event: { epic: Epic, status: any}) {
    const { epic, status } = event;
    let statusForChange;
    let titleForChange;
    const epicName = epic.name;
    if (status === 'ACTIVE') {
      statusForChange = 'unarchive';
      titleForChange = 'Unarchive Epic';
    } else if (status === 'ARCHIVED') {
      statusForChange = 'archive';
      titleForChange = 'Archive Epic';
    } else if (status === 'DELETED') {
      statusForChange = 'delete';
      titleForChange = 'Delete Epic';
    }
    this.genericIsOpen = true;
    this.genericConfirm.show({
      text: `Are you sure you want to ${statusForChange} "${epicName}" epic? All linked tasks will be archived`,
      headlineText: titleForChange,
      confirmText: statusForChange,
     callback: () => {
      epic.status = status;
      this.genericIsOpen = false;
      return this.onEpicRemove(epic);
    }});
  }

  getSelectedEpic(selectedEpic: any) {
    if (selectedEpic.moreBtnOpen === true) {
      this.epicsList.map(epic => {
        epic.moreBtnOpen = false;
      });
    } else {
      this.epicsList.map(epic => {
        epic.moreBtnOpen = false;
      });
      selectedEpic.moreBtnOpen = !selectedEpic.moreBtnOpen;
    }
  }

  onEpicRemove(epic: Epic) {
    this.epicsRestService.remove(epic._id, { status: epic.status }).subscribe(res => {
      this.epicsList = this.epicsList.filter((e: Epic) => e._id !== epic._id);
      this.closeEpicModal();
      this.toastrService.success(`Epic \"${epic.name}\" successfully ${epic.status === 'ACTIVE' ? 'activated' : epic.status === 'DELETED' ? 'deleted' : 'archived'}`);
    });
  }

  isFormDirty(formDirty: boolean) {
    this.formDirty = formDirty;
  }
}
