import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProjectsRestService, Project } from '@aitheon/project-manager';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute} from '@angular/router';
import { RouterStateService } from 'src/app/shared/services/router-state.service';

@Component({
  selector: 'ai-project-settings-access',
  templateUrl: './project-settings-access.component.html',
  styleUrls: ['./project-settings-access.component.scss']
})
export class ProjectSettingsAccessComponent implements OnInit {

  projectId: string;
  accessList: any = [];
  loadingProject = false;
  isButtonDisabled = true;
  projectAccessForm: FormGroup;
  activeOrganization: any;
  projectData: Project = {};

  constructor(private projectsRestService: ProjectsRestService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastrService: ToastrService,
    private routerStateService: RouterStateService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.buildForm();
    this.getActiveOrganization();
    this.buildAccessList();
  }

  getProject() {
    this.loadingProject = true;
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.projectsRestService.getById(this.projectId).subscribe((project: Project) => {
        this.loadingProject = false;
        this.projectData = project;
        this.buildForm();
      }, (error: any) => {
        this.loadingProject = false;
        this.toastrService.error(`${error || error.statusText}`);
      });

    });
  }

  getActiveOrganization() {
    this.authService.activeOrganization.subscribe((organization: any) => {
      this.activeOrganization = organization;
      this.getProject();
    });
  }

  buildForm() {
    this.projectAccessForm = this.formBuilder.group({
      access: [this.projectData.type, [Validators.required]]
    });
  }

  buildAccessList() {
    this.accessList = [
      { icon: 'fa fa-globe', value: 'PUBLIC', title: 'Public', description: 'Anyone with access to organization can create and edit issues.' },
      { icon: 'fa fa-lock', value: 'PRIVATE', title: 'Private', description: 'Only people added to the project can create and edit issues.' }
    ];
  }

  updateProjectAccess() {
    if (this.projectAccessForm.valid) {
      this.isButtonDisabled = true;
      this.projectsRestService.update(this.projectId, { type: this.projectAccessForm.value.access }).subscribe((project: Project) => {
        this.isButtonDisabled = false;
        this.projectData = project;
        this.onValueChange();
        this.toastrService.success(` Project access updated`);
      }, (error: any) => {
        this.isButtonDisabled = false;
        this.toastrService.error(`${error || error.statusText}`);
      });
    } else {
      return;
    }
  }

  onValueChange() {
    this.isButtonDisabled = this.projectData.type === this.projectAccessForm.value.access;
  }
}
