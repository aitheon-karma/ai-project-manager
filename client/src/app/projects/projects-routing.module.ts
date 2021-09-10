import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppDashboardComponent } from '../shared/components/app-dashboard/app-dashboard.component';
import { ProjectsDashboardComponent } from './projects-dashboard/projects-dashboard.component';
import { BoardComponent } from '../boards/board/board.component';
import { BacklogDashboardComponent } from '../backlog/backlog-dashboard/backlog-dashboard.component';
import { BoardLoaderComponent } from '../boards/board-loader/board-loader.component';
import { ProjectsMediaComponent } from './projects-media/projects-media.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: ':projectId', component: ProjectsDashboardComponent,
    children: [
      { path: '', redirectTo: 'project-dashboard', pathMatch: 'full' },
      {
        path: 'automation',
        loadChildren: () => import('../automation/automation.module').then(m => m.AutomationModule)
      },
      {
        path: 'project-dashboard', component: AppDashboardComponent
      },
      {
        path: 'boards', component: BoardLoaderComponent
      },
      {
        path: 'boards/:boardId', component: BoardComponent
      },
      {
        path: 'backlog', component: BacklogDashboardComponent
      },
      {
        path: 'media', component: ProjectsMediaComponent
      },
      {
        path: 'settings',
        // canActivate: [SettingsGuard],
        loadChildren: '../project-settings/project-settings.module#ProjectSettingsModule'
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { }
