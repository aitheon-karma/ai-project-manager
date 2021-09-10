import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskCommentsComponent } from './tasks/task-comments/task-comments.component';
import { ProjectInvitationComponent } from './projects/project-invitation/project-invitation.component';


const routes: Routes = [
  {path: 'comments', component: TaskCommentsComponent},
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'projects', loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule) },
  { path: 'project-invitation/:inviteId', component: ProjectInvitationComponent },
  { path: 'epics', loadChildren: () => import('./epics/epics.module').then(m => m.EpicsModule) },
  { path: 'automation', loadChildren: () => import('./automation/automation.module').then(m => m.AutomationModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
