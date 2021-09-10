import { AutomationModule } from './../automation/automation.module';
import { SharedModule } from '../shared/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { CoreClientModule } from '@aitheon/core-client';
import { ProjectsModule } from '../projects/projects.module';
import { EpicsModule } from '../epics/epics.module';
import { GlobalSearchComponent } from './global-search/global-search.component';
import { AvatarModule } from 'ngx-avatar';
import { TasksModule } from '../tasks/tasks.module';

@NgModule({
  declarations: [DashboardComponent, GlobalSearchComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    CoreClientModule,
    TooltipModule,
    ProjectsModule,
    EpicsModule,
    SharedModule,
    AvatarModule,
    TooltipModule.forRoot(),
    TasksModule,
    AutomationModule
  ]
})
export class DashboardModule { }
