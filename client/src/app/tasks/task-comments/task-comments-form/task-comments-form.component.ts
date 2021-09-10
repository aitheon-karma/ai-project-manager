import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AuthService, DriveUploaderComponent } from '@aitheon/core-client';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';
import { CommentsRestService, Comment, ProjectTasksRestService, TaskNotify } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { ProjectsService } from '../../../projects/projects.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';
import { COMMENT_EDITOR_CONFIG } from '../../shared/constants/task-comment.editor.config';
import { TaskCommentsService } from '../../shared/task-comments.service';

import { Subscription } from 'rxjs';
import { TasksService } from '../../tasks.service';

interface Mention {
  id: string,
  userName: string,
  name: string,
  userId: string,
  logoURL: string
}

@Component({
  selector: 'ai-task-comments-form',
  templateUrl: './task-comments-form.component.html',
  styleUrls: ['./task-comments-form.component.scss']
})
export class TaskCommentsFormComponent implements OnInit {
  @ViewChild('editor') editor: RichTextEditorComponent;
  @ViewChild('attachIcon') attachIcon: ElementRef;

  @Input() taskId: string;
  @Input() projectId: string;
  @Input() editingComment: Comment;

  subscriptions: Subscription[] = [];
  currentServiceKey: { _id: string; key: string };
  serviceFolder: string;
  submitted = false;
  commentControl: FormControl;
  me: any;
  files = [];
  commentFieldStatus: string;
  parentCommentId: string;
  commentEditorConfig = COMMENT_EDITOR_CONFIG;
  isMacPlatform: boolean;
  isCommentFocused: boolean;
  mentions: Mention[];
  addedMentions: Mention[] = [];
  tagReplaceRegExp = new RegExp('(<([^>]+)>)|(&nbsp;)', 'ig');

  static noWhitespaceValidator(control: FormControl): null | {
    whitespace: boolean,
  } {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  constructor(
    private toastr: ToastrService,
    private authService: AuthService,
    private commentService: CommentsRestService,
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private projectTasksRestService: ProjectTasksRestService,
    private taskCommentsService: TaskCommentsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(this.authService.currentUser.subscribe(user => {
      this.me = user;
    }));
    this.subscriptions.push(this.authService.activeOrganization.subscribe(org => {
      this.currentServiceKey = { _id: environment.service, key: org._id };
    }));
    this.subscriptions.push(this.taskCommentsService.replyedComment$.subscribe(replyCommentInfo => {
      this.parentCommentId = replyCommentInfo as any;
      this.commentFieldStatus = 'reply';
      this.editor.setFocused();
    }));

    this.serviceFolder = this.projectId;
    this.files = this.editingComment && this.editingComment.attachments ? this.editingComment.attachments : [];

    this.initCommentControl();
    this.initEditorConfig();
  }

  initCommentControl(): void {
    this.commentControl = new FormControl(
      this.editingComment ? this.editingComment.text : '',
      [Validators.required, TaskCommentsFormComponent.noWhitespaceValidator],
    );
  }

  initEditorConfig(): void {
    this.isMacPlatform = !!window.navigator.platform.match('Mac');
    this.commentEditorConfig.placeholder = 'Add a comment';
    this.commentEditorConfig.mention.feeds[0].feed = this.getMentions.bind(this);
    this.getProjectMembers();
  }

  getProjectMembers(): void {
    this.subscriptions.push(this.projectsService.getProjectMembers(
      this.projectId || this.tasksService.getProject(),
    ).subscribe(members => {
      this.mentions = this.projectsService.getMentions(members);
    }));
  }

  onSuccessUpload(event: any): void {
    const file = _.pick(event, '_id', 'contentType', 'name', 'signedUrl');
    this.files.push(file);
    this.commentControl.setValidators(null);
    this.commentControl.updateValueAndValidity();
  }

  submit(): void {
    this.submitted = true;
    if (this.commentControl.invalid && this.files.length === 0) {
      this.toastr.error('Comment can`t be empty');
      this.updateView();
      return;
    }

    const comment = {
      task: this.taskId,
      attachments: [...this.files],
      text: this.commentControl.value,
    } as Comment;
    if (this.parentCommentId) {
      comment.parent = this.parentCommentId;
    }

    if (this.editingComment) {
      this.updateComment(comment);
    } else {
      this.createComment(comment);
    }

    if (this.addedMentions.length) {
      this.createNotifies();
    }
  }

  createComment(comment: Comment): void {
    this.subscriptions.push(this.commentService.create(this.taskId, comment)
      .subscribe(createdComment => {
        this.taskCommentsService.commentSaved(createdComment, 'CREATE');
        this.submitted = false;
        this.cancel();
      }, err => {
        this.toastr.error('Could not create the comment')
      }));
  }

  updateComment(comment: Comment): void {
    comment.task = this.editingComment.task;
    this.editingComment.text = comment.text;
    this.editingComment.attachments = comment.attachments;
    this.editingComment.updatedAt = new Date().toISOString();
    this.subscriptions.push(this.commentService.update(this.editingComment.task, this.editingComment._id, comment)
      .subscribe((updatedComment: Comment) => {
        this.taskCommentsService.commentSaved(updatedComment, 'UPDATE');
        this.quitReply();
      }, err => {
        this.toastr.error('Could not update comment')
      }));
  }

  createNotifies(): void {
    const notify = {
      users: this.addedMentions.map(({ userId }) => userId),
      task: this.tasksService.getModalTask(),
      message: this.editor.getData().replace(this.tagReplaceRegExp, ''),
    } as TaskNotify;
    this.subscriptions.push(this.projectTasksRestService.notify(notify).subscribe(() => {}));
  }

  setCommentInputStatus(focused: boolean): void {
    this.isCommentFocused = focused;
  }

  showFileUploader(): void {
    this.attachIcon.nativeElement.dispatchEvent(new MouseEvent('click'));
  }

  isFileImage(data: any): boolean {
    return data.contentType.includes('image');
  }

  openFile(url: string): void {
    window.open(url, '_blank');
  }

  removeFile(e: Event, index: number): void {
    this.stopEvent(e);
    this.files.splice(index, 1);
    if (!this.files.length) {
      this.setValidator();
    }
  }

  private setValidator(): void {
    this.commentControl.setValidators([Validators.required, TaskCommentsFormComponent.noWhitespaceValidator]);
  }

  fileAdded(event: any, driveUploader: DriveUploaderComponent): void {
    if (event.file.size > 100000000) {
      driveUploader.uploader.cancelAll();
      driveUploader.uploader.clearQueue();
      this.toastr.error('File size should be less than 100 MB');
    }
  }

  quitReply(): void {
    this.commentFieldStatus = '';
    this.parentCommentId = undefined;
    this.commentFieldStatus = undefined;
    this.files = [];
    this.addedMentions = [];
    this.updateView()
  }

  cancel(event?: Event): void {
    if (event) {
      this.stopEvent(event);
    }
    this.commentControl.reset();
    this.isCommentFocused = false;
    this.files = [];
    this.taskCommentsService.commentSaved();
    this.quitReply();
  }

  async getMentions(query: string): Promise<any[]> {
    return (this.mentions || []).filter(({ id, name }) => id.toLowerCase().includes(query.toLowerCase()) || name.toLowerCase().includes(query.toLowerCase()));
  }

  onMentionCreated(mention: { id: string, userId: string, userName: string, name: string, logoURL: string }): void {
    this.addedMentions.push(mention);
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  updateView(): void {
    try {
      this.cdr.detectChanges();
    } catch (e) {}
  }
}