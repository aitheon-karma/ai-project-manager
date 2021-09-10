import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BacklogDashboardComponent } from './backlog-dashboard/backlog-dashboard.component';
const routes: Routes = [
  {
    path: '', component: BacklogDashboardComponent,
    children: []
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BacklogRoutingModule { }
