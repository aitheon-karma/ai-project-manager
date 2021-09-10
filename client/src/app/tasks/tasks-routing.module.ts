import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskCommentsComponent } from './task-comments/task-comments.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TasksRoutingModule { }
