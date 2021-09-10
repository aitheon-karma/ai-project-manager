import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FileViewerService } from '../../shared/components/file-viewer/service/file-viewer.service';
import { DocumentsRestService } from '@aitheon/drive'
import { AuthService, DriveDocumentsService } from '@aitheon/core-client';
import { environment } from './../../../environments/environment';
import { take } from 'rxjs/operators'
import { ToastrService } from 'ngx-toastr';
import { ProjectsRestService } from '@aitheon/project-manager';

@Component({
  selector: 'ai-projects-media',
  templateUrl: './projects-media.component.html',
  styleUrls: ['./projects-media.component.scss']
})
export class ProjectsMediaComponent implements OnInit {

  constructor(private fileViewerService: FileViewerService,
              private documentsService: DocumentsRestService,
              private authService: AuthService,
              private route: ActivatedRoute,
              private modalService: BsModalService,
              private toastrService: ToastrService,
              private projectService: ProjectsRestService,
              private driveDocumentsService: DriveDocumentsService) { }

  @ViewChild('addFileModal') addFileModal: TemplateRef<any>;
  @ViewChild('viewer') viewer: TemplateRef<any>;

  modalRef: BsModalRef;
  files = [];
  showMoreImages: boolean = false;
  showMoreVideos: boolean = false;
  showMoreFiles: boolean = false;
  images: any[] = [];
  videos: any[] = [];
  otherFiles: any[] = [];
  filesForViewer: any[] = [];
  uploadedFiles: any[] = [];
  projectId: string;
  loading: boolean = true;
  isTypeLink: boolean = false;
  fileURL: string;
  currentUser: any;
  organizationId: string;
  serviceKey: { _id: string; key: string; };
  myURL:any;
  isFilesUploaded: boolean = false;
  imageFromUrlError: boolean = false;
  filesReceived: boolean = false;
  viewerModalRef: BsModalRef;

  ngOnInit() {
    this.projectId = this.route.parent.snapshot.params.projectId;

    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });

    this.authService.activeOrganization.pipe(take(1)).subscribe((org: any) => {
      if (!environment.production && org) {
        this.documentsService.defaultHeaders = this.documentsService.defaultHeaders.set('organization-id', org._id);
      }
      this.organizationId = org._id;
      this.serviceKey = { _id: environment.service, key: org._id };

      this.getAllFiles();
    });
  }

  getAllFiles() {
    this.projectService.getAddProjectFolder(this.projectId).subscribe(folder => {
      if(folder && folder._id){
        this.documentsService.list(environment.service, folder._id, this.organizationId, 1000).subscribe(res => {
          this.files = res;
          this.images = this.files.filter(file => file.contentType.includes('image')).slice(0, 11);
          this.videos = this.files.filter(file => file.contentType.includes('video')).slice(0, 11);
          this.otherFiles = this.files.filter(file => file.contentType.includes('application')).slice(0, 11);
          this.loading = false;
        });
      }
    });
  }

  toggleSection(type: string) {
    if (type == 'images') {
      if (this.showMoreImages) {
        this.showMoreImages = false;
        this.images = this.files.filter(file => file.contentType.includes('image')).slice(0, 11);
      } else {
        this.showMoreImages = true;
        this.images = this.files.filter(file => file.contentType.includes('image'));
      }
    } else if (type == 'videos') {
      if (this.showMoreVideos) {
        this.showMoreVideos = false;
        this.videos = this.files.filter(file => file.contentType.includes('video')).slice(0, 11);
      } else {
        this.showMoreVideos = true;
        this.videos = this.files.filter(file => file.contentType.includes('video'));
      }
    } else if (type == 'files') {
      if (this.showMoreFiles) {
        this.showMoreFiles = false;
        this.otherFiles = this.files.filter(file => file.contentType.includes('application')).slice(0, 11);
      } else {
        this.showMoreFiles = true;
        this.otherFiles = this.files.filter(file => file.contentType.includes('application'));
      }
    }
  }

  openAddFileModal(template: TemplateRef<any>, type: string) {
    this.modalRef = this.modalService.show(template, { ignoreBackdropClick: true });

    if (type == 'link') {
      this.isTypeLink = true
    } else {
      this.isTypeLink = false
    }
  }

  onPreviewFileOpen(file: any) {
    this.viewerModalRef = this.modalService.show(this.viewer, {
      class: 'modal-viewer',
    });
    if (file.contentType.includes('image')) {
      this.filesForViewer = this.images;
    } else if (file.contentType.includes('video')) {
      this.filesForViewer = this.videos;
    } else {
      this.filesForViewer = this.otherFiles;
    }

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

  close() {
    this.myURL = null;
    this.modalRef.hide();
    this.uploadedFiles = [];
    this.imageFromUrlError = false;
  }

  uploadImageFromLink(url: string) {
    let fileObj = {
        service:{
          _id: environment.service,
          key: this.organizationId
        },
        serviceFolder: this.projectId,
        url,
        organization: this.organizationId
    }

    this.imageFromUrlError = false;

    this.documentsService.createFromExternal(fileObj).subscribe(res => {
      this.toastrService.success(`File added`);
      this.getAllFiles();
      this.close();
    }, error => {
      this.imageFromUrlError = true;
      this.toastrService.error('You can only upload images/pdf files');
    }
    );
  }

  fileUploaded(file: any) {
    this.uploadedFiles.push(file);
    this.isFilesUploaded = true;
  }

  failedUpload() {
    this.toastrService.error('Upload failed');
  }

  saveUploadedImages() {
    if (this.isFilesUploaded) {
      this.toastrService.success(`Files are added`);
      this.getAllFiles();
      this.close();
    } else {
      this.toastrService.success(`Upload failed`);
    }
  }

  removeUploadedFiles() {
    this.uploadedFiles.forEach((file, i) => {
      this.driveDocumentsService.remove(file._id).subscribe(res => {
        this.uploadedFiles.splice(i, 1);
      });
    });
    this.close();
  }

  removeFile(event: any, index: number) {
    event.stopPropagation();
    event.preventDefault();
    const file = this.uploadedFiles[index];
    this.driveDocumentsService.remove(file._id).subscribe((result: any) => {
      this.uploadedFiles.splice(index, 1);
      this.toastrService.success(`File removed`);
    });
  }
}
