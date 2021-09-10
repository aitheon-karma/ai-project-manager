import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DriveUploaderComponent, AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ProjectsRestService, LabelsRestService, Project, Label } from '@aitheon/project-manager';
import { RouterStateService } from 'src/app/shared/services/router-state.service';
import { GenericConfirmComponent } from 'src/app/shared/components/generic-confirm/generic-confirm.component';
import { GeneralService } from '../../shared/services/general/general.service';
@Component({
  selector: 'ai-project-settings-details',
  templateUrl: './project-settings-details.component.html',
  styleUrls: ['./project-settings-details.component.scss']
})
export class ProjectSettingsDetailsComponent implements OnInit {

  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;
  @ViewChild('createLabelForm') createLabelForm: ElementRef;
  @ViewChild('projectName') projectName: ElementRef;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;

  isLabelToEdit: Boolean = false;
  labelId: string;
  actionDropdown = false;
  project: Project;
  projectForm: FormGroup;
  counterShow: boolean;
  serviceKey: { _id: string; key: string; };
  loading: boolean = false;
  labelFormModalRef: BsModalRef;
  labels: Array<Label> = [];
  isButtonDisabled: boolean = false;
  projectId: string;
  labelToEdit: Label;
  isProjectOwner: boolean;
  organizationId: string;
  modalHeader: string;
  confirmTextBtn: string;
  nameMask = /^[^\s][a-zA-Z0-9_ ]+([\s-\/]+[a-zA-Z0-9\s]+)*$/;

  constructor(
    private router: Router,
    private projectRestService: ProjectsRestService,
    private toastr: ToastrService,
    private authService: AuthService,
    private modalService: BsModalService,
    private fb: FormBuilder,
    private labelsRestService: LabelsRestService,
    private routerStateService: RouterStateService,
    private generalService: GeneralService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.authService.activeOrganization.subscribe((organization: any) => {
      this.organizationId = organization._id;
      this.serviceKey = {
        _id: 'PROJECT_MANAGER',
        key: `${organization._id}`
      };
    });
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.getProjectDetails(params.projectId);
    });
  }

  getProjectDetails(projectId: string) {
    this.loading = true;
    this.projectRestService.getById(projectId).subscribe((project: Project) => {
      this.loading = false;
      this.isProjectOwner = this.generalService.findIsProjectOwner(project, this.organizationId);
      this.project = project;
      if (this.project) {
        this.patchProjectDetails(this.project);
      }

      // get labels of project
      this.getLabelsByProjectId(this.project._id);
    }, (error) => {
      this.loading = false;
      this.toastr.error(error);
    });
  }

  getLabelsByProjectId(projectId: string) {
    this.loading = true;
    this.labelsRestService.getByProjectId(projectId).subscribe((labels: Array<Label>) => {
      this.loading = false;
      this.labels = labels;
    }, (error) => {
      this.loading = false;
      this.toastr.error(error);
    });
  }

  patchProjectDetails(project: Project) {
    this.projectForm.patchValue({
      name: project.name,
      description: project.description,
      cover: project.cover ? project.cover : ''
    });
  }

  buildForm() {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(this.nameMask)]],
      description: ['', [Validators.maxLength(200)]],
      cover: ['']
    });
  }

  updateProject(project: Project, isStatusChanged = false, showDialog = true) {
    this.isButtonDisabled = true;

    const updateProjectCall = () => {
      this.projectRestService.update(project._id || this.projectId, project).subscribe((projectResponse: Project) => {
        if (isStatusChanged) {
          this.project.status = projectResponse.status;
          this.toastr.success(`Project ${project.status === 'ACTIVE' ? 'moved to all projects list' : project.status == 'DELETED' ? 'deleted' : 'archived'}`);
          this.router.navigate(['/projects']);
        } else {
          this.toastr.success('Project updated');
          this.patchProjectDetails(projectResponse);
        }
      }, (err) => {
        this.toastr.error(err.message || err);
      });
    };

    if (project.status === 'ARCHIVED') {
      this.modalHeader = 'Archive Project';
      this.confirmTextBtn = 'Archive';
    } else {
      this.modalHeader = 'Unarchive Project';
      this.confirmTextBtn = 'Unarchive';
    }
    if (project.status === 'DELETED') {
      this.modalHeader = 'Delete Project';
      this.confirmTextBtn = 'Delete';
    }

    if (showDialog) {
      this.genericConfirm.show({
        headlineText: this.modalHeader, confirmText: this.confirmTextBtn,
        text: `Are you sure you want to ${project.status == 'ACTIVE' ? 'unarchive' : project.status == 'DELETED' ? 'delete' : 'archive' } "${this.project.name}" project?
              ${ project.status === 'ACTIVE' ? '' : project.status == 'DELETED' ? 'All tasks in this project, will be deleted.' : 'All tasks in this project, will be archived.'}`,
        callback: () => {
          updateProjectCall()
        }
      });
    } else {
      updateProjectCall();
    }
  }

  onSaveChanges() {
    if (this.projectForm.invalid) {
      return;
    }
    this.project.name = this.projectForm.value.name;
    this.project.description = this.projectForm.value.description;
    this.project['cover'] = this.projectForm.value.cover;
    this.updateProject(this.project, false, false);
  }

  onActionClick(event: Event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    this.labelId = id;
    this.actionDropdown = true;
  }

  editProjectName() {
    this.projectName.nativeElement.focus();
  }

  closeLabelFormModal() {
    this.labelFormModalRef.hide();
    this.getLabelsByProjectId(this.project._id);
    this.isLabelToEdit = false;
  }

  createLabel(label) {
    this.getLabelsByProjectId(this.project._id);
  }
  openUpdateLabelModal(label: Label) {
    this.labelToEdit = label;
    this.isLabelToEdit = true;
    this.actionDropdown = false;
    this.labelFormModalRef = this.modalService.show(this.createLabelForm);
  }

  openCreateLabelModal() {
    this.actionDropdown = false;
    this.labelToEdit = undefined;
    this.labelFormModalRef = this.modalService.show(this.createLabelForm);
  }
  updateLabel(label) {
    this.getLabelsByProjectId(this.project._id);
  }

  removeLabelById(label: Label) {
    this.genericConfirm.show({
      confirmText: 'delete',
      headlineText: 'Remove label',
      text: `Are you sure, you want to remove label '${label.name}'?`, callback: (confirm: any) => {
        this.labelsRestService.remove(label._id).subscribe((res) => {
          this.getLabelsByProjectId(this.project._id);
        }, error => {
          this.toastr.error('Error while deleting label.');
        });
      }
    });
  }

  validateUploadedFile(event) {
    let sizeNotAllowed = false;
    let typeNotAllowed = false;
    let errorMessage = '';
    if (!(((event.file.size / 1000) / 1000) < 2)) {
      sizeNotAllowed = true;
      errorMessage = 'File size limit exceeded, should be less than 2 MB.';
    }
    if (!event.file.type.match('image.png') && !event.file.type.match('image.jpeg')) {
      typeNotAllowed = true;
      errorMessage = 'File type unknown, only images, videos and pdf are allowed.';
    }
    if (sizeNotAllowed || typeNotAllowed) {
      this.driveUploader.uploader.cancelAll();
      this.driveUploader.uploader.clearQueue();
      this.toastr.error(errorMessage);
    }
  }

  onCancleCover() {
    this.projectForm.get('cover').setValue('');
    this.projectForm.markAsDirty();
    this.project['cover'] = '';
  }

  onSuccessUpload(event) {
    this.projectForm.get('cover').setValue(event.signedUrl);
    this.projectForm.markAsDirty();
  }

  removeUploadedImage() {
    this.projectForm.get('cover').setValue('');
    this.projectForm.markAsDirty();
  }

  failedUpload() {
    this.projectForm.get('cover').setValue('');
    this.toastr.error('Upload failed');
  }
}
