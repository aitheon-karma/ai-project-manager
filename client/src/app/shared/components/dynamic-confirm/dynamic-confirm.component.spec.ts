import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicConfirmComponent } from './dynamic-confirm.component';

describe('DynamicConfirmComponent', () => {
  let component: DynamicConfirmComponent;
  let fixture: ComponentFixture<DynamicConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
