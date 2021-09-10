import { ApplicationBuildService, AuthService, GraphRefType, ModalService } from '@aitheon/core-client';
import { GraphsRestService } from '@aitheon/system-graph';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { ProjectsService } from '../../../projects/projects.service';
import { ApplicationsService, ApplicationType, ReferenceType } from '../../services/applications.service';
import { OrganizationsService } from '../../services/organizations.service';

@Component({
  selector: 'ai-app-dashboard',
  templateUrl: './app-dashboard.component.html',
  styleUrls: ['./app-dashboard.component.scss']
})
export class AppDashboardComponent implements OnInit, OnDestroy {
  @Input() isServiceDashboard: boolean;

  private subscriptions$ = new Subscription();
  selectedApplication: any;
  applications: any[];
  isLoading = true;
  graphUrl: string;
  projectId: string;
  serviceKey = 'PROJECT_MANAGER';
  public isAppsDropdownOpened: boolean;
  private selectedApplicationId: string;

  constructor(
    public authService: AuthService,
    public modalService: ModalService,
    private applicationBuildService: ApplicationBuildService,
    private toastr: ToastrService,
    private applicationsService: ApplicationsService,
    private graphsRestService: GraphsRestService,
    private organizationsService: OrganizationsService,
    private route: ActivatedRoute,
    private projectsService: ProjectsService
  ) {}

  ngOnInit() {
    this.subscriptions$.add(this.organizationsService.currentOrganization$.pipe(
      take(1),
      switchMap(() => {
        this.organizationsService.setHeaders(this.graphsRestService);
        return this.projectsService.projectId$;
      })).subscribe(projectId => {
      this.projectId = projectId;
      this.getDashboardApplications();
    }));
  }

  openApplicationsFlowModal() {
    this.modalService.openModal('AUTOMATE_MODAL', {
      type: ApplicationType.DASHBOARD,
      reference: this.isServiceDashboard ? this.serviceKey : this.projectId,
      referenceType: this.isServiceDashboard ? GraphRefType.SERVICE : GraphRefType.PROJECT,
      existing: this.applications?.map(app => app?.project?._id) || [],
    });
  }

  getDashboardApplications(): void {
    let request$ = this.applicationsService.getApplicationsByService(ApplicationType.DASHBOARD);
    if (!this.isServiceDashboard) {
      request$ = this.applicationsService.getApplications(this.projectId, ReferenceType.SPECIAL, ApplicationType.DASHBOARD);
    }
    this.subscriptions$.add(request$.subscribe(graphData => {
        this.applications = graphData?.applications;
        this.checkForSelectedApp();
        if (graphData?.graphId) {
          this.graphUrl = `/system-graph/graphs/organization/service/PROJECT_MANAGER/sub-graph/${graphData?.graphId}`;
        }
        this.isLoading = false;
        this.applicationBuildService.setBuildStatus$(null);
      },
      () => {
        this.isLoading = false;
        this.applicationBuildService.setBuildStatus$(null);
      }));
  }

  public toggleAppsDropdown(): void {
    this.isAppsDropdownOpened = !this.isAppsDropdownOpened;
  }

  onCreateNode(e: { name: string; type: any }) {
    const data = {
      name: e.name,
      service: this.serviceKey,
      type: e.type,
      subType: ApplicationType.DASHBOARD,
    } as any;
    if (!this.isServiceDashboard) {
      data.meta = { projectId: this.projectId };
    }
    this.applicationBuildService.createApplication(data);
    this.onBuildFinish();
  }

  onBuildFinish() {
    this.applicationBuildService.buildFinished$.pipe(take(1)).subscribe(() => {
      this.getDashboardApplications();
    });
  }

  onEditDashboardApp(): void {
    this.applicationBuildService.editApplication(this.selectedApplication.project?._id);
    this.onBuildFinish();
  }

  deployDashboardApp(graphNodes: any[]): void {
    if (graphNodes) {
      const [dashboardNode] = graphNodes;
      if (dashboardNode) {
        this.applicationBuildService.setBuildStatus$({
          current: 'Deploying...',
          steps: ['Deploying...'],
          approximateTime: '40 seconds',
        });
        this.graphsRestService.deployNode({ graphNodeId: dashboardNode?._id, publish: true }).subscribe();
        const timeout = setTimeout(() => {
          this.getDashboardApplications();
          clearTimeout(timeout);
        }, 25000);
      }
    }
  }

  onDeleteDashboardApplication({ graphNodeId }): void {
    this.isLoading = true;
    this.subscriptions$.add(this.graphsRestService.removeApplication({
      graphNodeId,
    }).subscribe(() => {
        this.getDashboardApplications();
        this.toastr.success('Dashboard application successfully removed!');
      },
      (error) => {
        this.isLoading = false;
        this.toastr.error(error?.message || 'Unable to remove dashboard application');
      }));
  }

  private checkForSelectedApp(): void {
    if (this.applications?.length) {
      let application;
      if (this.selectedApplicationId) {
        application = this.applications.find(({ graphNodeId }) => graphNodeId === this.selectedApplicationId);
      }
      if (!application) {
        application = this.applications[0];
      }
      this.selectApplication(application);
    } else {
      this.selectedApplicationId = null;
      this.selectedApplication = null;
    }
  }

  public selectApplication(application: any): void {
    this.selectedApplicationId = application?.graphNodeId;
    this.selectedApplication = application;
  }

  public goToCore(): void {
    if (this.graphUrl) {
      window.open(this.graphUrl, '_blank');
    }
  }

  ngOnDestroy() {
    try {
      this.subscriptions$.unsubscribe();
    } catch (e) {
    }
  }
}

