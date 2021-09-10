import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoreClientModule } from '@aitheon/core-client';

import { ProjectSettingsRoutingModule } from './project-settings-routing.module';
import { ProjectSettingsDashboardComponent } from './project-settings-dashboard/project-settings-dashboard.component';
import { ProjectSettingsDetailsComponent } from './project-settings-details/project-settings-details.component';
import { ProjectSettingsMembersComponent } from './project-settings-members/project-settings-members.component';
import { ProjectSettingsAccessComponent } from './project-settings-access/project-settings-access.component';
import { ProjectSettingsWorkspacesComponent } from './project-settings-workspaces/project-settings-workspaces.component';
import { ProjectSettingsOrganizationsComponent } from './project-settings-organizations/project-settings-organizations.component';
import { SharedModule } from '../shared/shared.module';
import { TabsModule } from 'ngx-bootstrap/tabs';

@NgModule({
  declarations: [
    ProjectSettingsDashboardComponent,
    ProjectSettingsDetailsComponent,
    ProjectSettingsMembersComponent,
    ProjectSettingsAccessComponent,
    ProjectSettingsWorkspacesComponent,
    ProjectSettingsOrganizationsComponent
  ],
  imports: [
    CommonModule,
    ProjectSettingsRoutingModule,
    CoreClientModule,
    SharedModule,
    TabsModule.forRoot()
  ]
})
export class ProjectSettingsModule { }
