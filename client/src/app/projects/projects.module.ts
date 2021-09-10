import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';

import { CoreClientModule } from '@aitheon/core-client';

import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ProjectsFormComponent } from './projects-form/projects-form.component';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';
import { ProjectsSettingsComponent } from './projects-settings/projects-settings.component';
import { ProjectsCardComponent } from './projects-card/projects-card.component';
import { ProjectsDetailComponent } from './projects-detail/projects-detail.component';
import { TasksModule } from '../tasks/tasks.module';
import { RouterStateService } from 'src/app/shared/services/router-state.service';
import { SharedModule } from '../shared/shared.module';
import { ProjectInvitationComponent } from './project-invitation/project-invitation.component';
import { ProjectsMediaComponent } from './projects-media/projects-media.component';
import { HttpClientModule } from '@angular/common/http';
import { NgxSmoothDnDModule } from 'ngx-smooth-dnd';
import { ProjectOrderModalComponent } from './project-order-modal/project-order-modal.component';

@NgModule({
  declarations: [
    ProjectsListComponent,
    ProjectsFormComponent,
    ProjectsDashboardComponent,
    ProjectsSettingsComponent,
    ProjectsCardComponent,
    ProjectsDetailComponent,
    ProjectInvitationComponent,
    ProjectsMediaComponent,
    ProjectOrderModalComponent,
  ],
  imports: [
    CommonModule,
    ProjectsRoutingModule,
    CoreClientModule,
    ModalModule.forRoot(),
    TooltipModule,
    TasksModule,
    SharedModule,
    HttpClientModule,
    NgxSmoothDnDModule,
  ],
  providers: [RouterStateService],
  exports: [
    ProjectsListComponent
  ]
})
export class ProjectsModule { }
