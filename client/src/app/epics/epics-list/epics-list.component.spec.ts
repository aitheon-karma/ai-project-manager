import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicsListComponent } from './epics-list.component';

describe('EpicsListComponent', () => {
  let component: EpicsListComponent;
  let fixture: ComponentFixture<EpicsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EpicsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
