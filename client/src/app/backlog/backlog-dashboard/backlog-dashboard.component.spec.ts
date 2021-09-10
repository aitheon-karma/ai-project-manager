import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BacklogDashboardComponent } from './backlog-dashboard.component';

describe('BacklogDashboardComponent', () => {
  let component: BacklogDashboardComponent;
  let fixture: ComponentFixture<BacklogDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BacklogDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BacklogDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
