import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicDashboardComponent } from './epic-dashboard.component';

describe('EpicsDashboardComponent', () => {
  let component: EpicDashboardComponent;
  let fixture: ComponentFixture<EpicDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EpicDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
