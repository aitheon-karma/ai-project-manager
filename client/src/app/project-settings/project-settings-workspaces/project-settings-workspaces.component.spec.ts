import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsWorkspacesComponent } from './project-settings-workspaces.component';

describe('ProjectSettingsWorkspacesComponent', () => {
  let component: ProjectSettingsWorkspacesComponent;
  let fixture: ComponentFixture<ProjectSettingsWorkspacesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsWorkspacesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsWorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
