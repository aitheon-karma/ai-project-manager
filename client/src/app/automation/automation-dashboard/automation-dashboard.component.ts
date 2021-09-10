import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectsService } from '../../projects/projects.service';

@Component({
  selector: 'ai-automation-dashboard',
  template: `
      <ai-automation [projectId]="projectId"></ai-automation>
  `,
})
export class AutomationDashboardComponent implements OnInit, OnDestroy {
  projectId: string;
  private subscriptions$ = new Subscription();

  constructor(
    private projectsService: ProjectsService,
  ) {}

  ngOnInit(): void {
    this.subscriptions$.add(this.projectsService.projectId$.subscribe(projectId => {
      this.projectId = projectId;
    }));
  }

  ngOnDestroy(): void {
    try {
      this.subscriptions$.unsubscribe();
    } catch (e) {
    }
  }
}
