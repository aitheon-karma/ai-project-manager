import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsMediaComponent } from './projects-media.component';

describe('ProjectsMediaComponent', () => {
  let component: ProjectsMediaComponent;
  let fixture: ComponentFixture<ProjectsMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectsMediaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
