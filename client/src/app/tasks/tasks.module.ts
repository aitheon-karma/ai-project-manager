import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TasksRoutingModule } from './tasks-routing.module';
import { TasksCardComponent } from './tasks-card/tasks-card.component';
import { TasksDashboardComponent } from './tasks-dashboard/tasks-dashboard.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { AvatarModule } from 'ngx-avatar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreClientModule } from '@aitheon/core-client';
import { TaskModalComponent } from './shared/task-modal/task-modal.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TasksAttachmentsComponent } from './tasks-attachments/tasks-attachments.component';
import { TaskAssigneeFormComponent } from './task-assignee-form/task-assignee-form.component';
import { TaskLabelsComponent } from './task-labels/task-labels.component';
import { TaskCommentsComponent } from './task-comments/task-comments.component';
import { TaskCommentsFormComponent } from './task-comments/task-comments-form/task-comments-form.component';
import { TaskCommentsListComponent } from './task-comments/task-comments-list/task-comments-list.component';
import { SharedModule } from '../shared/shared.module';
import { TasksEpicsComponent } from './tasks-epics/tasks-epics.component';
import { TaskDueDateComponent } from './task-due-date/task-due-date.component';
import { TaskSubtasksComponent } from './task-subtasks/task-subtasks.component';

@NgModule({
  declarations: [
    TasksCardComponent,
    TasksDashboardComponent,
    TaskFormComponent,
    TaskModalComponent,
    TasksAttachmentsComponent,
    TaskAssigneeFormComponent,
    TaskLabelsComponent,
    TaskCommentsComponent,
    TaskCommentsFormComponent,
    TaskCommentsListComponent,
    TasksEpicsComponent,
    TaskDueDateComponent,
    TaskSubtasksComponent
  ],
  imports: [
    CommonModule,
    TasksRoutingModule,
    TooltipModule.forRoot(),
    AvatarModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    CoreClientModule,
    TypeaheadModule.forRoot()
  ],
  exports: [
    TasksCardComponent,
    TaskModalComponent,
    TasksAttachmentsComponent
  ]
})
export class TasksModule { }
