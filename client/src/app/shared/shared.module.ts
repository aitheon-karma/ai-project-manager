import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { GenericConfirmComponent } from './components/generic-confirm/generic-confirm.component';
import { InviteFormComponent } from './components/invite-form/invite-form.component';
import { CoreClientModule } from '@aitheon/core-client';
import { EpicFormComponent } from './components/epic-form/epic-form.component';
import { LabelFormComponent } from './components/label-form/label-form.component';
import { SafeHTMLPipe } from './pipes/safe-html.pipe';
import { AvatarModule } from 'ngx-avatar';
import { FiltersPanelComponent } from './components/filters-panel/filters-panel.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FileViewerComponent } from './components/file-viewer/file-viewer.component';
import { RichTextEditorComponent } from './components/rich-text-editor/rich-text-editor.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { DynamicConfirmComponent } from './components/dynamic-confirm/dynamic-confirm.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { FileExtensionPipe } from './pipes/file-extension.pipe';
import { AppDashboardComponent } from './components/app-dashboard/app-dashboard.component';

@NgModule({
  declarations: [
    FileUploadComponent,
    GenericConfirmComponent,
    InviteFormComponent,
    EpicFormComponent,
    LabelFormComponent,
    SafeHTMLPipe,
    FiltersPanelComponent,
    FileViewerComponent,
    RichTextEditorComponent,
    DynamicConfirmComponent,
    ClickOutsideDirective,
    FileExtensionPipe,
    AppDashboardComponent
  ],
  imports: [
    CKEditorModule,
    CommonModule,
    CoreClientModule,
    AvatarModule,
    TooltipModule.forRoot(),
  ],
  exports: [
    FileUploadComponent,
    GenericConfirmComponent,
    InviteFormComponent,
    EpicFormComponent,
    LabelFormComponent,
    SafeHTMLPipe,
    FiltersPanelComponent,
    FileViewerComponent,
    RichTextEditorComponent,
    DynamicConfirmComponent,
    ClickOutsideDirective,
    FileExtensionPipe,
    AppDashboardComponent
  ]
})
export class SharedModule { }
