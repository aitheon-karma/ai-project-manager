import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicCardComponent } from './epic-card.component';

describe('EpicCardComponent', () => {
  let component: EpicCardComponent;
  let fixture: ComponentFixture<EpicCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EpicCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
