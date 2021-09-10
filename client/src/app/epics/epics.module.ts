import { CoreClientModule } from '@aitheon/core-client';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksModule } from '../tasks/tasks.module';

import { EpicsRoutingModule } from './epics-routing.module';
import { EpicDashboardComponent } from './epics-dashboard/epic-dashboard.component';
import { EpicsListComponent } from './epics-list/epics-list.component';
import { EpicCardComponent } from './epic-card/epic-card.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { SharedModule } from '../shared/shared.module'
import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    EpicDashboardComponent,
    EpicsListComponent,
    EpicCardComponent,
  ],
  imports: [
    CommonModule,
    CoreClientModule,
    EpicsRoutingModule,
    ReactiveFormsModule,
    TasksModule,
    SharedModule,
    BsDatepickerModule.forRoot(),
    DragDropModule,
    TooltipModule.forRoot()
  ],
  exports: [
    EpicsListComponent
  ]
})
export class EpicsModule {
}
