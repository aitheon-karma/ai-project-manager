import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectInvitationComponent } from './project-invitation.component';

describe('ProjectInvitationComponent', () => {
  let component: ProjectInvitationComponent;
  let fixture: ComponentFixture<ProjectInvitationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectInvitationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
