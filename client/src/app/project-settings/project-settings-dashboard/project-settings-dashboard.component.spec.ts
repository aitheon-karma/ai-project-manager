import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsDashboardComponent } from './project-settings-dashboard.component';

describe('ProjectSettingsDashboardComponent', () => {
  let component: ProjectSettingsDashboardComponent;
  let fixture: ComponentFixture<ProjectSettingsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
