import { Injectable } from '@angular/core';
import { ProjectsRestService } from '@aitheon/project-manager';

import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  projectsMembers: {
    [key: string]: any[],
  } = {};

  private _projectId$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(
    private projectsRestService: ProjectsRestService,
  ) {}

  getProjectMembers(projectId: string): Observable<any[]> {
    if (!projectId) {
      return of([]);
    }
    if (this.projectsMembers[projectId]) {
      return of(this.projectsMembers[projectId]);
    }
    return this.projectsRestService.members(projectId).pipe(tap(members => {
      this.projectsMembers[projectId] = members;
    }));
  }

  getMentions(members: any[]): {
    id: string,
    userName: string,
    name: string,
    userId: string,
    logoURL: string,
  }[] {
    const mentions = [];
    for (const member of members || []) {
      const { user = {} as any } = member;

      if (user.profile && user.profile.firstName && user.profile.lastName) {
        mentions.push({
          id: `@${user.profile.firstName} ${user.profile.lastName}`,
          username: user.username ? `@${user.username}` : '',
          name: `@${user.profile.firstName} ${user.profile.lastName}`,
          userId: user._id,
          logoURL: user.profile.avatarUrl
        });
      }
    }
    return mentions;
  }

  setProjectId(id: string) {
    this._projectId$.next(id);
  }

  get projectId$() {
    return this._projectId$.asObservable();
  }
}
