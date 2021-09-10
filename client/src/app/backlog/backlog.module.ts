import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BacklogDashboardComponent } from './backlog-dashboard/backlog-dashboard.component';
import { BacklogListComponent } from './backlog-list/backlog-list.component';
import { CoreClientModule } from '@aitheon/core-client';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TasksModule } from '../tasks/tasks.module';
import { SharedModule } from '../shared/shared.module';
import { AvatarModule } from 'ngx-avatar';

@NgModule({
  declarations: [BacklogDashboardComponent, BacklogListComponent],
  imports: [
    CoreClientModule,
    CommonModule,
    CoreClientModule,
    TooltipModule.forRoot(),
    TasksModule,
    AvatarModule,
    SharedModule
  ]
})
export class BacklogModule { }
