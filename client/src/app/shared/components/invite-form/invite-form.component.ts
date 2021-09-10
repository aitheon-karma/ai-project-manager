import { Component, OnInit, EventEmitter, Output, Input, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';
import { ProjectsRestService, SharedRestService, ProjectInvitesRestService } from '@aitheon/project-manager';
import { RouterStateService } from 'src/app/shared/services/router-state.service';

@Component({
  selector: 'ai-invite-form',
  templateUrl: './invite-form.component.html',
  styleUrls: ['./invite-form.component.scss']
})
export class InviteFormComponent implements OnInit {
  @Input('entity') entity: string;
  @Output('onInvited') onInvited: EventEmitter<any> = new EventEmitter<any>();
  @Output('onCancel') onCancel: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('search') searchElement: ElementRef;
  roles = ['Admin', 'Member'];
  contacts: any;
  searchFocus: boolean;
  existingProjectMembers: any[] = [];
  membersToInvite: any = [];
  projectId: any;
  currentOrganization: any;
  searchText: string;
  currentUser: any;
  membersInviteForm: FormGroup;
  searchResultArray: any[] = [];
  existingProjectRole: any;


  inviteeOrgs = [];
  resultedOrgs: any[] = [];
  orgsToInvite: any[] = [];
  invitedOrganizations: any;

  loading: boolean = false;
  projectDetails: any;
  orgIds: any[] = [];
  memberData = {
    members: [],
    project: this.projectDetails,
    individual: true
  };
  tempArray: any[] = [];
  loadingSearchResult: boolean;
  isMembersAdding: boolean;
  isOrgsAdding: boolean;
  searchFocused: boolean;

  constructor(
    private projectRestService: ProjectsRestService,
    private sharedRestService: SharedRestService,
    private projectInvitesRestService: ProjectInvitesRestService,
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private routerStateService: RouterStateService) { }

  ngOnInit() {
    this.initializeForm();
    this.authService.activeOrganization.subscribe((org: any) => {
      this.currentOrganization = org;
    });
    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });
    this.getProjectDetails();
  }

  initializeForm() {
    this.membersInviteForm = this.fb.group({
      members: this.fb.array([])
    });
  }

  getProjectMembers(projectId) {
    this.existingProjectRole = this.projectDetails.roles.filter(role => role.organization._id === this.currentOrganization._id);
    this.existingProjectMembers = this.existingProjectRole[0].members;
    this.existingProjectRole[0].members.forEach(member => {
      this.existingProjectMembers.push(member.user._id);
    });
    this.loading = false;
  }

  onClick(contact) {
    if (!this.tempArray.includes(contact.user._id)) {
      this.membersToInvite.push(contact.user);
      this.tempArray.push(contact.user._id);
    } else {
      this.removeFromArray(contact);
    }
  }

  removeFromArray(contact) {
    this.removeFromMembersToInvite(contact);
    this.removeFromTempArr(contact);
  }

  removeFromControls(member) {
    _.remove(this.members.controls, (n: any) => {
      return member.controls._id.value === n.controls._id.value;
    });
  }

  removeFromTempArr(member, formType = false) {
    const target = formType ? member.controls._id.value : member.user._id;
    _.remove(this.tempArray,  (n: any) => {
      return n === target;
    });
  }

  removeFromMembersToInvite(member, formType = false) {
    const target = formType ? member.controls._id.value : member.user._id;
    _.remove(this.membersToInvite, (n: any) => {
      return n._id === target;
    });
  }

  onSearch(searchText?: any) {
    this.loadingSearchResult = true;
    this.orgIds = [];
    this.orgIds.push(this.currentOrganization._id);
    this.searchResultArray = [];
    if (!searchText) {
      this.loadingSearchResult = false
      return this.contacts;
    }
    searchText = searchText.toLowerCase();
    this.sharedRestService.membersByOrgId(searchText).subscribe((res: any) => {
      this.searchResultArray = res;
      this.loadingSearchResult = false;
    }, error => {
      this.loadingSearchResult = false;
      this.toastr.error(`Could not fetch project members.`)
    });
  }

  onDone() {
    this.searchText = undefined;
    this.searchFocus = false;
    while (this.members.length > 0) {
      this.members.removeAt(0);
    }
    if (this.membersToInvite.length) {
      this.membersToInvite.forEach((member => {
        this.memberData.members.push(member.email);
        this.members.push(this.fb.group({
          firstName: member.profile.firstName,
          lastName: member.profile.lastName,
          email: member.email,
          role: 'Member',
          _id: member._id,
          avatarUrl: member.profile && member.profile.avatarUrl || 'assets/contact.jpg'
        }));
      }));
    }
  }

  onRemove(member: any) {
    this.removeFromControls(member);
    this.removeFromTempArr(member, true);
    this.removeFromMembersToInvite(member, true);
  }

  onBlur() {
    this.searchFocus = false;
  }

  onInvite() {
    this.isMembersAdding = true;
    const inviteList: any = [];
    if (this.members.controls.length) {
      this.members.controls.forEach((control: any) => {
        inviteList.push({
          user: control.value._id,
          memberRole: control.value.role.toUpperCase(),
          accessType: this.existingProjectRole[0].accessType
        });
      });
      this.projectRestService.addMembers(this.projectId, inviteList).subscribe((res: any) => {
        this.toastr.success('Members added successfully');
        this.onInvited.emit(true);
        this.isMembersAdding = false;
      }, (err => {
        this.toastr.error(err.error.message);
        this.isMembersAdding = false
      })
      );
    }
  }


  onClose(event) {
    this.onCancel.emit(event);
  }

  get members() {
    return this.membersInviteForm.get('members') as FormArray;
  }

  getProjectDetails() {
    this.loading = true;
    this.routerStateService.params$.subscribe((params: any) => {
      this.projectId = params.projectId;
      this.projectRestService.getById(this.projectId).subscribe((res: any) => {
        this.projectDetails = res;
        this.memberData.project = res;
        this.getProjectMembers(this.projectId);
      }, (error) => {
        this.toastr.error('Got error while fetching project');
      });
    });
    this.projectInvitesRestService.list(this.projectId).subscribe((res) => {
      this.invitedOrganizations = res.map(org => org.organization._id);
    });
  }

  clearValue() {
    this.searchText = undefined;
    this.searchElement.nativeElement.focus();
  }


  /**For organization **/

  onSearchOrg(searchTerm) {
    this.searchOrganizations(searchTerm);
  }
  onClickOrg(org) {
    let flag = 0;
    if (this.orgsToInvite.length > 0) {
      for (let i = 0; i < this.orgsToInvite.length; i++) {
        if (this.orgsToInvite[i]._id == org._id) {
          this.orgsToInvite.splice(i, 1);
          flag = 1;
          break;
        }
      }
      if (flag === 0) {
        this.orgsToInvite.push(org);
      }
    } else {
      this.orgsToInvite.push(org);
    }
  }

  onDoneOrg() {
    this.searchText = undefined;
    this.searchFocus = false;
    this.inviteeOrgs = this.orgsToInvite;
  }

  onRemoveOrg(index, org) {
    this.orgsToInvite.splice(index, 1);
  }

  searchOrganizations(term: string) {
    this.resultedOrgs = [];
    this.sharedRestService.getOrgs(term).subscribe((res: any) => {
      res = res.filter(org => org._id != this.currentOrganization._id);
      this.resultedOrgs = res;
      this.resultedOrgs.map(org => {
        if (org.domain) {
          if (org.domain.length > 20) {
            org['subdomain'] = org.domain.slice(0, 17) + '...';
          } else {
            org['subdomain'] = org.domain;
          }
        }
        if (org.name.length > 20) {
          org['subName'] = org.name.slice(0, 17) + '...';
        } else {
          org['subName'] = org.name;
        }
      });
    });
  }

  checkAdded(org) {
    let flag = 0;
    this.orgsToInvite.forEach(added => {
      if (added._id === org._id) {
        flag = 1;
      }
    });
    if (flag === 0) {
      return true;
    } else {
      return false;
    }
  }

  onInviteOrg() {
    let shareableOrgs = [];
    shareableOrgs = this.inviteeOrgs;
    if (shareableOrgs.length > 0) {
      const data = {
        project: this.projectId,
        organization: shareableOrgs.map(org => org._id),
      };
      this.isOrgsAdding = true;
      this.projectInvitesRestService.create(data).subscribe((res: any) => {
        this.isOrgsAdding = false;
        this.toastr.success('Organizations invited');
        this.onInvited.emit(true);
        this.onClose(false);
      }, (error) => {
        this.isOrgsAdding = false;
        this.toastr.error('Error while inviting organization');
        this.onInvited.emit(false);
        this.onClose(false);
      });
    }
  }
}
