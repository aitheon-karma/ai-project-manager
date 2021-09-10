import { TaskModalService } from 'src/app/tasks/shared/task-modal.service';
import {  Component, OnInit, AfterViewInit, OnDestroy, Input,
          HostListener, OnChanges, SimpleChanges, ElementRef,
          ViewChild, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { Comment, CommentsRestService } from '@aitheon/project-manager';
import { AuthService } from '@aitheon/core-client';
import { TaskCommentsService } from '../../shared/task-comments.service';
import { FileViewerService } from '../../../shared/components/file-viewer/service/file-viewer.service';

import { Subscription } from 'rxjs';
import { TasksService } from '../../tasks.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

interface TaskComment extends Comment {
  replyComments: any[];
  isReplyCommentsOpen: boolean;
}

@Component({
  selector: 'ai-task-comments-list',
  templateUrl: './task-comments-list.component.html',
  styleUrls: ['./task-comments-list.component.scss']
})
export class TaskCommentsListComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('commentText') commentText: ElementRef;
  @ViewChild('comment') comment: ElementRef;
  @ViewChild('commentsListView') commentsListView: ElementRef;
  @ViewChild('viewer') viewer: TemplateRef<any>;
  @Input() comments: TaskComment[];

  subscriptions: Subscription[] = [];
  me: any;
  loading = false;
  actionCommentId: string;
  deleteCommentId: string;
  editingComment: Comment;
  filesForViewer: any;
  filesReceived: boolean;
  showDocumentViewerForm: any = false;
  commentsListObserver: MutationObserver;
  commentAdded: boolean;
  viewerModalRef: BsModalRef;

  @HostListener('document:click', ['$event'])
  documentClick(event: any): void {
    if (this.actionCommentId) {
      this.updateView();
      this.actionCommentId = undefined;
    }
  }

  constructor(
    private authService: AuthService,
    private taskCommentsService: TaskCommentsService,
    private commentsRestService: CommentsRestService,
    private tasksService: TasksService,
    private taskModalService: TaskModalService,
    private fileViewerService: FileViewerService,
    private cdr: ChangeDetectorRef,
    private modalService: BsModalService
  ) {}

  ngOnInit() {
    this.subscriptions.push(this.authService.currentUser.subscribe(user => {
      this.me = user;
    }));

    this.listenToCommentSave();
  }

  ngAfterViewInit(): void {
    this.commentsListObserver = new MutationObserver((data) => {
      if (this.commentAdded) {
        this.taskModalService.setScrollDown(true);
        this.commentAdded = false;
      }
    });
    this.commentsListObserver.observe(this.commentsListView.nativeElement, { childList: true });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.comments) {
      changes.comments.currentValue.forEach(comment => {
        if (comment.text && comment.text.length) {
          comment.text = comment.text.replace('<a ', '<a target="_blank" '); 
        }
      });
    }
  }

  actionClick(commentId: string, event: Event): void {
    this.stopEvent(event);
    this.actionCommentId = this.actionCommentId === commentId ? undefined : commentId;
    this.updateView();
  }

  onEdit(comment: Comment) {
    this.editingComment = { ...comment };
  }

  listenToCommentSave(): void {
    this.subscriptions.push(this.taskCommentsService.commentSaved$.subscribe((data) => {
      this.editingComment = undefined;
      if (!data) {
        this.loading = false;
        return;
      }
      const { comment, saveType } = data;

      if (comment.text && comment.text.length) {
        comment.text = comment.text.replace('<a ', '<a target="_blank" ');
      }

      if (comment.parent) {
        this.saveReply(comment);
        return;
      }
      if (saveType === 'CREATE') {
        this.commentAdded = true;
        this.comments.push(comment as any);
      } else {
        this.comments = this.comments.map(item => {
          if (item._id !== comment._id) {
            return item;
          }
          return {
            ...item,
            ...comment,
          };
        });
      }
      this.loading = false;
      this.updateView();
    }));
  }

  saveReply(comment: Comment): void {
    const parentCommentIndex = this.comments.findIndex(({ _id }) => _id === comment.parent);
    if (parentCommentIndex >= 0) {
      const parent = this.comments[parentCommentIndex];
      if (parent.replyComments) {
        const commentIndex = parent.replyComments.findIndex(({ _id }) => _id === comment._id);
        if (commentIndex >= 0) {
          parent.replyComments.splice(commentIndex, 1, comment);
        } else {
          parent.replyComments.push(comment);
        }
      } else {
        parent.replyComments = [comment];
      }
    }
    this.loading = false;
    this.updateView();
  }

  deleteComment(comment: Comment, $event: Event) {
    this.deleteCommentId = comment._id;
    this.actionCommentId = undefined;
    $event.stopPropagation();
    $event.preventDefault();
    this.updateView();
  }

  confirmDelete(comment: Comment) {
    this.subscriptions.push(this.commentsRestService._delete(
      comment.task || this.tasksService.getModalTask()._id,
      comment._id
    ).subscribe(() => {
      if (comment.parent) {
        const parentComment = this.comments.find(({ _id }) => _id === comment.parent);
        if (parentComment) {
          parentComment.replyComments = parentComment.replyComments.filter(({ _id }) => _id !== comment._id);
        }
      } else {
        this.comments = this.comments.filter(({ _id }) => _id !== comment._id);
      }
      this.deleteCommentId = undefined;
      this.updateView();
    }));
  }

  cancelDelete() {
    this.deleteCommentId = undefined;
  }

  openFile(url: string) {
    window.open(url, '_blank');
  }

  isFileImage(data: any): boolean {
    return data.contentType.includes('image');
  }

  onReplyComment(commentId: string, event: Event) {
    this.stopEvent(event);
    this.taskCommentsService.replyComment(commentId);
  }

  onPreviewFileOpen(file: any, files: any) {
    this.viewerModalRef = this.modalService.show(this.viewer, {
      class: 'modal-viewer',
    });
    setTimeout(() => {
      this.fileViewerService.changeStatus(file);
    }, 10);
    this.filesForViewer = files;
    this.filesReceived = true;
  }

  onCloseViewer(): void {
    this.viewerModalRef.hide();
    this.filesReceived = false;
  }

  updateView(): void {
    try {
      this.cdr.detectChanges();
    } catch (e) {}
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }

  trackById(item: any) {
    return item._id;
  }

  ngOnDestroy(): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe();
      } catch (e) {
      }
    }
  }
}
