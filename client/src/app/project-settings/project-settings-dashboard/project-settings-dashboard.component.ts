import { Component, OnInit } from '@angular/core';
import { RouterStateService } from '../../shared/services/router-state.service';
import { ProjectsRestService, Project } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@aitheon/core-client';
import * as _ from 'lodash';
import { GeneralService } from '../../shared/services/general/general.service';

@Component({
  selector: 'ai-project-settings-dashboard',
  templateUrl: './project-settings-dashboard.component.html',
  styleUrls: ['./project-settings-dashboard.component.scss']
})
export class ProjectSettingsDashboardComponent implements OnInit {
  projectId: string;
  loading = true;
  project: Project;
  isProjectOwner = false;
  organizationId: string;

  constructor(
    private projectRestService: ProjectsRestService,
    private routerStateService: RouterStateService,
    private toastr: ToastrService,
    private authService: AuthService,
    private generalService: GeneralService
  ) { }

  ngOnInit() {
    this.authService.activeOrganization.subscribe((organization: any) => {
      this.organizationId = organization._id;
      this.routerStateService.params$.subscribe((params: any) => {
        this.projectId = params.projectId;
        this.generalService.isAdmin(this.projectId);
        this.getProject(params.projectId);
      });
    });
  }

  getProject(projectId: string) {
    this.loading = true;
    this.projectRestService.getById(projectId).subscribe((project: Project) => {
      this.loading = false;
      this.project = project;
      this.isProjectOwner = this.generalService.findIsProjectOwner(this.project, this.organizationId);
    }, (error) => {
      this.loading = false;
      this.toastr.error('Error while getting project');
    });
  }

}
