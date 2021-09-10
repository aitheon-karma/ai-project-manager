import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicFormComponent } from './epic-form.component';

describe('EpicFormComponent', () => {
  let component: EpicFormComponent;
  let fixture: ComponentFixture<EpicFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EpicFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EpicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
