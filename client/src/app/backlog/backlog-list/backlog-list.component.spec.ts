import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BacklogListComponent } from './backlog-list.component';

describe('BacklogListComponent', () => {
  let component: BacklogListComponent;
  let fixture: ComponentFixture<BacklogListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BacklogListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BacklogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
