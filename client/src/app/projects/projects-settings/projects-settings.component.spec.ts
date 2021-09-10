import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsSettingsComponent } from './projects-settings.component';

describe('ProjectsSettingsComponent', () => {
  let component: ProjectsSettingsComponent;
  let fixture: ComponentFixture<ProjectsSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectsSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
