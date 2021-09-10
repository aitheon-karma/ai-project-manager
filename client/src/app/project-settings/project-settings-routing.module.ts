import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjectSettingsDashboardComponent } from './project-settings-dashboard/project-settings-dashboard.component';
import { ProjectSettingsDetailsComponent } from './project-settings-details/project-settings-details.component';
import { ProjectSettingsMembersComponent } from './project-settings-members/project-settings-members.component';
import { ProjectSettingsAccessComponent } from './project-settings-access/project-settings-access.component';
import { ProjectSettingsWorkspacesComponent } from './project-settings-workspaces/project-settings-workspaces.component';
import { ProjectSettingsOrganizationsComponent } from './project-settings-organizations/project-settings-organizations.component';

const routes: Routes = [
  { path: '', redirectTo: 'details', pathMatch: 'full' },
  {
    path: '', component: ProjectSettingsDashboardComponent,
    children: [
      {
        path: 'details', component: ProjectSettingsDetailsComponent
      },
      {
        path: 'members', component: ProjectSettingsMembersComponent
      },
      {
        path: 'access', component: ProjectSettingsAccessComponent
      },
      {
        path: 'workspaces', component: ProjectSettingsWorkspacesComponent
      },
      {
        path: 'organizations', component: ProjectSettingsOrganizationsComponent
      },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectSettingsRoutingModule { }
