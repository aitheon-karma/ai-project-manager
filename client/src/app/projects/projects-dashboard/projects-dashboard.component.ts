import { OrganizationsService } from '../../shared/services/organizations.service';
import { ProjectsService } from './../projects.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoardsRestService, Board, ProjectsRestService } from '@aitheon/project-manager';
import { TaskModalComponent } from '../../tasks/shared/task-modal/task-modal.component';
import { RouterStateService } from '../../shared/services/router-state.service';
import { GeneralService } from 'src/app/shared/services/general/general.service';
import { SettingsGuard } from 'src/app/shared/guards/settings.guard';
import { Cookie } from '@aitheon/core-client';
import { Subscription } from 'rxjs';
import { GraphsRestService } from '@aitheon/system-graph';
import { tap, take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'ai-projects-dashboard',
  templateUrl: './projects-dashboard.component.html',
  styleUrls: ['./projects-dashboard.component.scss']
})
export class ProjectsDashboardComponent implements OnInit {

  boards: Board[];
  isAdminOwner: boolean;
  projectStatus: string;
  private subscriptions$ = new Subscription();

  @ViewChild(TaskModalComponent)
  private taskFormComponent: TaskModalComponent;
  private _projectId: string;
  private _boardId: string;
  showAutomate: boolean = false;


  constructor(
    private boardsRestService: BoardsRestService,
    private routerStateService: RouterStateService,
    private projectService: ProjectsRestService,
    private generalService: GeneralService,
    private projService: ProjectsService,
    private organizationsService: OrganizationsService,
    private graphsRestService: GraphsRestService,
    public settingsGuard: SettingsGuard,
    public router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    const baseHost = Cookie.get('base_host');
    // this.showAutomate = baseHost !== 'beta.aitheon.com' && baseHost !== 'aitheon.com';
    this.subscriptions$.add(this.organizationsService.currentOrganization$.pipe(tap(() => {
      this.organizationsService.setHeaders(this.graphsRestService);
    }), switchMap(() => this.route.params), take(1)).subscribe(({ projectId }) => {
      this._projectId = projectId;
      this.projService.setProjectId(this._projectId);
      this.getProjectBoards(this._projectId);
      this.loadCurrentPermission();
      this.projectService.getById(this._projectId).subscribe(res => {
        this.projectStatus = res.status;
      });
    }));
    this._boardId = this.route.firstChild ? this.route.firstChild.snapshot.params.boardId : undefined;
    this.routerStateService.params$ = this.route.params;
  }

  openCreateModal() {
    this.taskFormComponent.show({
      boardId: this._boardId,
      project: this._projectId
    });
  }


  getProjectBoards(projectId: string) {
    this.boardsRestService.getByProjectId(projectId).subscribe((boards: Board[]) => {
      this.boards = boards;
    });
  }

  loadCurrentPermission() {
    this.projectService.isAdmin(this._projectId)
      .subscribe((result: any) => {
        this.generalService.setPermission(result && result.admin);
      });
  }

  goToProjectAutomation() {
    const projAutomationUrl = '/projects/' + this._projectId + '/automation';
    this.router.navigate([projAutomationUrl]);
  }
}
