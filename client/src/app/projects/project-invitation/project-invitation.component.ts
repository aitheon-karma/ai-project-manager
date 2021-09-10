import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project, ProjectInvitesRestService, ProjectInvite, BoardsRestService, Board } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'ai-project-invitation',
  templateUrl: './project-invitation.component.html',
  styleUrls: ['./project-invitation.component.scss']
})
export class ProjectInvitationComponent implements OnInit {

  project: Project;
  isLoading = true;
  projectInvite: ProjectInvite;
  projectInviteId: string;
  isError = false;
  errorMessage: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private projectInvitesRestService: ProjectInvitesRestService,
    private boardsRestService: BoardsRestService
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.projectInviteId = params.inviteId;
      this.getProjectInvite(this.projectInviteId);
    });
  }

  getProjectInvite(inviteId) {
    this.isLoading = true;
    this.projectInvitesRestService.findById(inviteId).subscribe((projectInvite: ProjectInvite) => {
      this.isLoading = false;
      this.projectInvite = projectInvite;
    }, (error) => {
      this.isLoading = false;
      if (error.status === 422) {
        this.isError = true;
      }
      this.errorMessage = error.error.message;
      this.toastr.error(this.errorMessage || 'Error while getting project invite');
    });
  }

  updateProjectInvite(projectInvite: ProjectInvite) {
    this.isLoading = true;
    this.projectInvitesRestService.update(this.projectInviteId, projectInvite).subscribe((projectInvite: ProjectInvite) => {
      this.isLoading = false;
      this.toastr.success(`Project Invite ${projectInvite.status}`);
      this.boardsRestService.getByProjectId(this.projectInvite.project._id).subscribe((boards: any) => {
        const mainBoard = _.find(boards, board => board.type === Board.TypeEnum.MAIN);
        if (projectInvite.status == ProjectInvite.StatusEnum.ACCEPTED)
          this.router.navigate([`/projects/${this.projectInvite.project._id}/boards/${mainBoard._id}`]);
        else
          this.router.navigate([`/dashboard`]);
      })
    }, error => {
      this.toastr.error(error.error && error.error.message || 'Error while updating project invite');
    });
  }

}
