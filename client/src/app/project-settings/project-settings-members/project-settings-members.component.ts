import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TabsetComponent } from 'ngx-bootstrap/tabs'
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GenericConfirmComponent } from '../../shared/components/generic-confirm/generic-confirm.component';
import { ProjectsRestService } from '@aitheon/project-manager';
import { AuthService } from '@aitheon/core-client';
import { RouterStateService } from 'src/app/shared/services/router-state.service';

@Component({
  selector: 'ai-project-settings-members',
  templateUrl: './project-settings-members.component.html',
  styleUrls: ['./project-settings-members.component.scss']
})
export class ProjectSettingsMembersComponent implements OnInit {
  roles = [{
    name: 'Admin',
    value: 'ADMIN'
  }, {
    name: 'Member',
    value: 'MEMBER'
  }];
  modalRef: BsModalRef;
  isCreator: boolean;
  @ViewChild('projectMemberModal') projectMemberModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('tabset') tabset: TabsetComponent;
  projectId: any;
  existingProjectMembers: any;
  loading = false;
  isMembersList = true;
  currentOrganization: any;
  project: any;
  existingProjectRole: any;
  service = 'Members';
  tabState = 1;
  sharedUsers: any[];

  constructor(private modalService: BsModalService,
    private router: Router,
    private toastrService: ToastrService,
    private projectService: ProjectsRestService,
    private authService: AuthService,
    private routerStateService: RouterStateService) {
  }

  ngOnInit() {
    this.authService.activeOrganization.subscribe((org) => {
      this.currentOrganization = org;
    });
    this.getProjectById();
  }

  updateRole(member, event) {
    if (member.isCreator) {
      return;
    }
    if (event) {

      const data = {
        'memberRole': event.value,
        'user': member.user._id,
        'accessType': this.existingProjectRole[0].accessType
      };

      this.projectService.changeMemberRole(this.projectId, data).subscribe((res: any) => {
        this.toastrService.success('Role updated.');
      }, (error) => {
        this.toastrService.error('Role was not updated, something went wrong.');
      });
    } else {
      this.toastrService.error('Please select a role to update it.');
    }
  }


  onInvited() {
    this.getProjectMembers(this.projectId);
    this.onCloseDialog(true);
  }

  removeMember(member, isCreator) {
    if (member && !isCreator) {
      this.genericConfirm.show({
        headlineText: 'Remove user',
        confirmText: 'delete',
        text: `Are you sure you want to remove "${member.user.profile.firstName} ${member.user.profile.lastName}"?`, callback: () => {
          const data = {
            'memberRole': member.role,
            'user': member.user._id,
            'accessType': this.existingProjectRole[0].accessType
          };
          this.projectService.removeMember(this.projectId, data).subscribe((res: any) => {
            this.toastrService.success('Member removed from project.');
            this.existingProjectRole = res.roles.filter(role => role.organization === this.currentOrganization._id);
            this.existingProjectMembers = this.existingProjectRole[0].members;
            this.existingProjectMembers.forEach(existingMember => {
              existingMember.user._id === this.project.createdBy ? existingMember.isCreator = true : existingMember.isCreator = false;
            });

          }, error => {
            this.toastrService.success('Member was not removed from project.');
          });
        }
      });
    }
  }


  getProjectById() {
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.projectService.getById(this.projectId).subscribe((res: any) => {
        this.project = res;
        this.getProjectMembers(this.projectId);
      });
    });
  }

  getProjectMembers(projectId) {
    this.loading = true;
    this.projectService.members(projectId).subscribe((res: any) => {

      this.existingProjectRole = this.project.roles.filter(role => role.organization._id === this.currentOrganization._id);

      this.sharedUsers = res.filter(user => {
        return user.accessType === 'SHARED';
      });

      this.existingProjectMembers = this.existingProjectRole[0].members;

      this.loading = false;
      this.existingProjectMembers.forEach(member => {
        member.user._id === this.project.createdBy ? member.isCreator = true : member.isCreator = false;
      });
    });
  }

  openDialog(template: TemplateRef<any>, project?: any, ) {
    this.modalRef = this.modalService.show(template, { backdrop: 'static', class: 'm-width' });
  }

  onCloseDialog(event) {
    if (event) {
      this.getProjectById();
    }
    this.modalRef.hide();
  }

  switchTab(tabIndex?: any) {
    this.tabState = tabIndex;
  }
}
