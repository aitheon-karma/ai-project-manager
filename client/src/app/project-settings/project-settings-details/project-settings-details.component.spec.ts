import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsDetailsComponent } from './project-settings-details.component';

describe('ProjectSettingsDetailsComponent', () => {
  let component: ProjectSettingsDetailsComponent;
  let fixture: ComponentFixture<ProjectSettingsDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
