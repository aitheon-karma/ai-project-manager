import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectOrderModalComponent } from './project-order-modal.component';

describe('ProjectOrderModalComponent', () => {
  let component: ProjectOrderModalComponent;
  let fixture: ComponentFixture<ProjectOrderModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectOrderModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectOrderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
