import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ProjectInvitesRestService, ProjectInvite } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { RouterStateService } from 'src/app/shared/services/router-state.service';
import { AuthService } from '@aitheon/core-client';
import { GenericConfirmComponent } from 'src/app/shared/components/generic-confirm/generic-confirm.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'ai-project-settings-organizations',
  templateUrl: './project-settings-organizations.component.html',
  styleUrls: ['./project-settings-organizations.component.scss']
})
export class ProjectSettingsOrganizationsComponent implements OnInit {
  projectId: string;
  loadingProjectInvite = false;
  projectInvites: ProjectInvite[] = [];
  activeOrganization: any = {};
  modalRef: BsModalRef;
  service: string = "Organization";
  @ViewChild('inviteOrgModal') inviteOrgModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;

  constructor(
    private modalService: BsModalService,
    private projectInvitesRestService: ProjectInvitesRestService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private routerStateService: RouterStateService
  ) { }

  ngOnInit() {
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.getActiveOrganization();
    });
  }

  getActiveOrganization() {
    this.authService.activeOrganization.subscribe((organization: any) => {
      this.activeOrganization = organization;
      this.getProjectInvites();
    });
  }

  getProjectInvites() {
    this.loadingProjectInvite = true;
    this.projectInvitesRestService.list(this.projectId).subscribe((projectInvites: ProjectInvite[]) => {
      this.loadingProjectInvite = false;
      this.projectInvites = projectInvites;
    }, (error: any) => {
      this.loadingProjectInvite = false;
      this.toastrService.error(`${error || error.statusText}`);
    });
  }

  removeProjectInvite(projectInvite: ProjectInvite) {
    this.genericConfirm.show({
      text: `Are you sure, you want to remove ${projectInvite.organization.name}`, callback: (confirm: any) => {
        this.projectInvitesRestService.remove(projectInvite._id).subscribe((projectInviteResponse: ProjectInvite) => {
          this.toastrService.success(`${projectInvite.organization.name} removed.`);
          this.getProjectInvites();
        }, (error: any) => {
          this.toastrService.error(`${error.error.message || error.statusText}`);
        })
      }
    });
  }

  onInvited() {
    this.getProjectInvites();
  }

  openDialog(template: TemplateRef<any>, project?: any, ) {
    this.modalRef = this.modalService.show(template, { backdrop: 'static', class: 'm-width' });
  }

  onCloseDialog(event) {
    this.modalRef.hide();
  }
}
