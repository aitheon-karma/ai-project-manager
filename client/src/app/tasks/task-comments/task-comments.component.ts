import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Comment, CommentsRestService } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ai-task-comments',
  templateUrl: './task-comments.component.html',
  styleUrls: ['./task-comments.component.scss']
})
export class TaskCommentsComponent implements OnInit, OnDestroy {
  @Input() taskId: string;
  @Input() projectId: string;
  @Input() taskReadonly: boolean;
  @Output() taskComments: EventEmitter<Comment[]> = new EventEmitter();

  me: any;
  comments: Comment[] = [];
  commentsFromServer: Comment[] = [];
  private getComments$: Subscription;

  constructor(
    private commentsService: CommentsRestService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    if (this.taskId) {
      this.getComments$ = this.commentsService.list(this.taskId).subscribe(comments => {
        this.formReplyComments(comments);
        this.taskComments.emit(comments);
      });
    }
  }

  addedComment(comment: Comment) {
    this.loadComments();
    this.toastr.success('Comment added');
  }

  commentDeleted(comment: Comment) {
    this.commentsService._delete(comment.task, comment._id).subscribe(() => {
      this.toastr.success('Comment deleted');
      if (comment.hasOwnProperty('replyComments')) {
        comment['replyComments'].map(replyComment => {
          this.commentsService._delete(replyComment.task, replyComment._id).subscribe(() => {});
        });
      }
      this.loadComments();
    }, err => {
      this.toastr.error('something went wrong' || err);
    });
  }

  private formReplyComments(pureComments: Comment[]) {
    const replyComments = [];

    pureComments.map((comment: Comment, index: number) => {
      if (!comment.parent) {
        comment['isReplyCommentsOpen'] = false;
        comment['replyComments'] = [];
      }
      if (comment.parent) {
        replyComments.push(comment);
      }
    });

    pureComments.map(comment => {
      if (!comment.parent) {
        replyComments.map(replyComment => {
          if (replyComment.parent === comment._id) {
            comment['replyComments'].push(replyComment);
          }
        });
      }
    });

    this.comments = pureComments.filter(filterComment => !filterComment.hasOwnProperty('parent'));
  }

  ngOnDestroy() {
    if (this.getComments$) {
      this.getComments$.unsubscribe();
    }
  }
}
