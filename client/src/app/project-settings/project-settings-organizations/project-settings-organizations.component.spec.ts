import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSettingsOrganizationsComponent } from './project-settings-organizations.component';

describe('ProjectSettingsOrganizationsComponent', () => {
  let component: ProjectSettingsOrganizationsComponent;
  let fixture: ComponentFixture<ProjectSettingsOrganizationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectSettingsOrganizationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSettingsOrganizationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
