import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { BehaviorSubject, ReplaySubject } from 'rxjs';
import { ProjectsRestService } from '@aitheon/project-manager';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class GeneralService {

  constructor(
    private projectsRestService: ProjectsRestService,
    private router: Router
  ) { }

  private currentPermission = new ReplaySubject<boolean>();

  findIsProjectOwner(project, organizationId): boolean {
    let isProjectOwner = false;
    const currentRole = _.find(project.roles, (role) => role.organization._id === organizationId);
    if (currentRole) {
      if (currentRole.accessType === 'OWNER') {
        isProjectOwner = true;
      }
    }
    return isProjectOwner;
  }

  currentPermission$() {
    return this.currentPermission;
  }

  setPermission(value: any) {
    this.currentPermission.next(value);
  }

  isAdmin(projectId: string) {
    this.projectsRestService.isAdmin(projectId).subscribe((isAdmin: any) => {
      if (!isAdmin.admin) {
        this.router.navigate(['/']);
      }
    });
  }

}
