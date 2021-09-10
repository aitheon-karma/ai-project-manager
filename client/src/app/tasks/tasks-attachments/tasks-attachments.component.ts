import { Component, OnInit, Output, Input, EventEmitter, OnChanges, ViewChild, TemplateRef } from '@angular/core';
import { AuthService, DriveDocumentsService } from '@aitheon/core-client';
import { environment } from '../../../environments/environment';
import { ProjectTask, Project } from '@aitheon/project-manager';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { FileViewerService } from '../../shared/components/file-viewer/service/file-viewer.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'ai-tasks-attachments',
  templateUrl: './tasks-attachments.component.html',
  styleUrls: ['./tasks-attachments.component.scss']
})
export class TasksAttachmentsComponent implements OnInit, OnChanges {
  files: any[] = [];
  organizationId: string;
  currentServiceKey: { _id: string; key: string };
  serviceFolder: string;
  filesReceived: boolean = false;
  viewerModalRef: BsModalRef;
  confirmOpen: boolean = false;
  confirmPosition: {
    left: string,
    top: string,
  } = {} as any;
  selectedAttachmentIndex: number;
  confirmChangePosition: boolean = false;

  constructor(private authService: AuthService,
              private toastr: ToastrService,
              private driveDocumentsService: DriveDocumentsService,
              private fileViewerService: FileViewerService,
              private modalService: BsModalService) { }

  @Input() task: ProjectTask;
  @Input() project: Project;
  @Input() taskReadonly: boolean;
  @Output() fileUploaded = new EventEmitter<any>();
  @Output() fileRemoved = new EventEmitter<any>();
  @ViewChild('viewer') viewer: TemplateRef<any>;

  ngOnInit() {
    this.authService.activeOrganization.subscribe(org => {
      this.organizationId = org._id;
      this.currentServiceKey = { _id: environment.service, key: org._id };
      this.serviceFolder = this.project && this.project._id;
    });
  }

  ngOnChanges() {
    if (this.task && Array.isArray(this.task.orchestratorTask.files)) {
      return this.files = [...this.task.orchestratorTask.files];
    }
    this.files = [];
  }

  isFileImage(data: any): boolean {
    return data.contentType.includes('image');
  }

  onSuccessUpload(event: any) {
    const file = _.pick(event, '_id', 'contentType', 'name', 'signedUrl', 'thumbnail');
    file._id = {
      _id: file._id,
      thumbnail: file.thumbnail
    };
    this.fileUploaded.emit(file);
    this.files.push(file);
    this.fileViewerService.changeFilesToView();
  }

  openFile(url: string) {
    window.open(url, '_blank');
  }

  fileAdded(event, driveUploader) {
    if (event.file.size > 100000000) {
      driveUploader.uploader.cancelAll();
      driveUploader.uploader.clearQueue();
      this.toastr.error('File size should be less than 100 MB');
    }
  }

  onPreviewFileOpen(file: any) {
    this.viewerModalRef = this.modalService.show(this.viewer, {
      class: 'modal-viewer',
    });
    let openTimeout = setTimeout(()=> {
      this.fileViewerService.changeStatus(file);
      clearTimeout(openTimeout);
    }, 10);
    
    this.filesReceived = true;
  }

  onCloseViewer() {
    this.viewerModalRef.hide();
    this.filesReceived = false;
  }

  openDynamicConfirm(e: Event, index: number) {
    e.preventDefault();
    e.stopPropagation();
    this.confirmChangePosition = false;

    const target = e.target as any;
    const rect = target.getBoundingClientRect();
    
    if (rect.x > window.innerWidth / 2 - 120) {
      this.confirmChangePosition = true;
    }

    this.selectedAttachmentIndex = index;
    this.confirmOpen = true;
  }

  removeFile() {
    const file = this.files[this.selectedAttachmentIndex];
        
    this.driveDocumentsService.remove(file._id._id).subscribe((result: any) => {
      if (typeof result === 'undefined') {
        this.fileRemoved.emit(file);
        this.files.splice(this.selectedAttachmentIndex, 1);
      }
      this.fileViewerService.changeFilesToView();
      this.closeDynamicConfirm();
    });

  }

  closeDynamicConfirm() {
    this.confirmOpen = false;
    this.selectedAttachmentIndex = null;
  }
}
