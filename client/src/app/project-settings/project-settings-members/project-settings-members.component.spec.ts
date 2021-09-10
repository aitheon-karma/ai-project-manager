import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsMembersComponent } from './project-settings-members.component';

describe('ProjectSettingsMembersComponent', () => {
  let component: ProjectSettingsMembersComponent;
  let fixture: ComponentFixture<ProjectSettingsMembersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsMembersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
