import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EpicDashboardComponent } from './epics-dashboard/epic-dashboard.component';
import { BoardComponent } from '../boards/board/board.component';

const routes: Routes = [
  { path: '/dashboard?tab=epics', component: BoardComponent },
  { path: ':epicId', component: EpicDashboardComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EpicsRoutingModule {
}
