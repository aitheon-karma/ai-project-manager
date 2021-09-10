import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsAccessComponent } from './project-settings-access.component';

describe('ProjectSettingsAccessComponent', () => {
  let component: ProjectSettingsAccessComponent;
  let fixture: ComponentFixture<ProjectSettingsAccessComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsAccessComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
