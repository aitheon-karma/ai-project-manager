import { AuthService, DriveUploaderComponent } from '@aitheon/core-client';
import { Component, OnInit, Input, Output, ViewChild, ElementRef, EventEmitter, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { Editor } from '@aitheon/ckeditor';
import { environment } from '../../../../environments/environment';
import { TasksService } from '../../../tasks/tasks.service';
import { UploadAdapterPlugin } from './upload.adapter';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RichTextEditorComponent),
    multi: true
  }],
})
export class RichTextEditorComponent implements OnInit {
  // NG_VALUE_ACCESSOR SECTION
  value: string;

  onChange: (_: any) => void = (_: any) => {};
  onTouched: () => void = () => {};

  updateChanges() {
    this.onChange(this.value);
  }

  writeValue(value: string): void {
    this.value = value;
    this.updateChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // END NG_VALUE_ACCESSOR SECTION

  @ViewChild('editorView') editorView: ElementRef;
  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;

  @Input() public disable: boolean;
  @Input() public config: any;
  @Input() private hideToolbarOnBlur: boolean;
  @Input() public customClass = '';
  @Input() public error: boolean;
  @Input() private saveOnEnter: boolean;

  @Output() mentionCreated: EventEmitter<{
    id: string,
    userId: string,
  }> = new EventEmitter<{id: string, userId: string}>();
  @Output() focusStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() attachFile: EventEmitter<void> = new EventEmitter<void>();
  @Output() save: EventEmitter<void> = new EventEmitter<void>();

  public editor = Editor;
  private editorInstance: any;
  public focused: boolean;
  public organizationId: string;
  public currentServiceKey: any;
  public serviceFolder: any;
  private imageUploaded = new Subject<any>();

  constructor(
    private authService: AuthService,
    private tasksService: TasksService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit(): void {
    this.authService.activeOrganization.pipe(take(1)).subscribe(org => {
      this.organizationId = org._id;
      this.currentServiceKey = { _id: environment.service, key: org._id };
      this.serviceFolder = this.tasksService.getProject();
    });
    if (this.config) {
      const uploadImage = this.uploadImage.bind(this);
      this.config.extraPlugins = [function (editor) {
        return UploadAdapterPlugin(editor, uploadImage)
      }];
    }
  }

  onEditorReady(editor: any): void {
    this.editorInstance = editor;    
    
    if (this.hideToolbarOnBlur) {
      this.hideToolbar();
    }

    if (this.saveOnEnter) {
      this.onKeyDown();
    }

    this.listenToMentionCreate(editor);
    this.listenToAttachButtonClick(editor);
    editor.editing.view.change(writer => {
      writer.setAttribute('spellcheck', 'false', editor.editing.view.document.getRoot());
    });

    const editorBody = this.editorView.nativeElement.querySelector('#task-description .ck-editor__editable');
    editorBody.addEventListener('scroll', () => {
      editorBody.focus();
    });

    try {
      this.editorInstance.ui.view.toolbar.children._items[2].buttonView.tooltipView.text = 'More options'
    } catch(error) {}
  }

  onFocus(): void {
    this.focused = true;
    this.focusStatus.emit(this.focused);
    if (!this.disable && this.hideToolbarOnBlur) {
      this.showToolbar();
    }
  }

  onBlur(): void {
    this.focused = false;
    this.focusStatus.emit(this.focused);
    if (this.hideToolbarOnBlur) {
      this.hideToolbar();
    }
  }

  listenToAttachButtonClick(editor: any): void {
    if (editor.commands.get('attach')) {
      editor.commands.get('attach').on('execute', () => {
        this.attachFile.emit();
      });
    }
  }

  listenToMentionCreate(editor: any): void {
    editor.commands.get('mention').on('execute', (event, args) => {
      this.mentionCreated.emit(args[0].mention);
    });
  }

  showToolbar(): void {
    const toolbar = this.editorView.nativeElement.querySelector('.ck-toolbar');
    toolbar.classList.remove('d-none');
  }

  hideToolbar(): void {
    const toolbar = this.editorView.nativeElement.querySelector('.ck-toolbar');
    toolbar.classList.add('d-none');
  }

  onSuccessUpload(event: any): void {
    this.imageUploaded.next(event);
  }

  uploadImage(file: File) {
    return new Promise(resolve => {
      this.imageUploaded.pipe(take(1)).subscribe(image => {
        resolve({
          default: image.signedUrl,
        });
      });
      this.driveUploader.uploader.addToQueue([file]);
      this.driveUploader.uploader.uploadAll();
    }).catch(() => {
      this.toastrService.error('Unable to add image');
    });
  }

  public getData(): string {
    return this.editorInstance.getData();
  }

  public setFocused(): void {
    if (this.editorInstance) {
      this.editorInstance.editing.view.focus();
    }
  }

  onKeyDown(): void {
    this.editorInstance.editing.view.document.on( 'keydown', (editorEvent, keyboardEvent: any) => {
      if (keyboardEvent.ctrlKey && keyboardEvent.domEvent.code === 'Enter') {
        this.stopEvent(keyboardEvent.domEvent);
        editorEvent.stop();
        return;
      }
      if (!keyboardEvent.shiftKey && !keyboardEvent.ctrlKey && keyboardEvent.domEvent.code === 'Enter') {
        this.stopEvent(keyboardEvent.domEvent);
        editorEvent.stop();
        this.save.emit();
      }
    }, { priority: 'high' });
  }

  stopEvent(event: Event | KeyboardEvent): void {
    event.stopPropagation();
    event.preventDefault();
  }
}
