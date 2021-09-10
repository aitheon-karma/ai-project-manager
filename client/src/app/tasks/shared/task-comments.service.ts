import { Injectable } from '@angular/core';
import { Comment } from '@aitheon/project-manager';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskCommentsService {
  private replyComment$: Subject<Comment> = new Subject<Comment>();
  private commentSave$ = new Subject<{
    saveType: 'CREATE' | 'UPDATE',
    comment: Comment,
  }>();

  public get replyedComment$(): Observable<Comment> {
    return this.replyComment$.asObservable();
  }

  public get commentSaved$(): Observable<{
    saveType: 'CREATE' | 'UPDATE',
    comment: Comment,
  }> {
    return this.commentSave$.asObservable();
  }

  public replyComment(comment): void {
    this.replyComment$.next(comment);
  }

  public commentSaved(comment?: Comment, saveType?: 'CREATE' | 'UPDATE'): void {
    this.commentSave$.next(comment && saveType ? {
      saveType,
      comment,
    } : null);
  }
}
