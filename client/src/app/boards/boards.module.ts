import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { CoreClientModule } from '@aitheon/core-client';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxMaskModule } from 'ngx-mask';
import { AvatarModule } from 'ngx-avatar';
import { NgxSmoothDnDModule } from 'ngx-smooth-dnd';

import { BoardsRoutingModule } from './boards-routing.module';
import { BoardComponent } from './board/board.component';
import { BoardsStagesFormComponent } from './boards-stages-form/boards-stages-form.component';
import { TasksModule } from '../tasks/tasks.module';
import { SharedModule } from '../shared/shared.module';
import { BoardLoaderComponent } from './board-loader/board-loader.component';

@NgModule({
  declarations: [
    BoardComponent,
    BoardsStagesFormComponent,
    BoardLoaderComponent,
  ],
  imports: [
    CommonModule,
    BoardsRoutingModule,
    CoreClientModule,
    TooltipModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    NgxMaskModule.forRoot(),
    DragDropModule,
    ColorPickerModule,
    AvatarModule,
    TasksModule,
    SharedModule,
    NgxSmoothDnDModule,
  ]
})
export class BoardsModule { }
