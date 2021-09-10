import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardsStagesFormComponent } from './boards-stages-form.component';

describe('BoardsStagesFormComponent', () => {
  let component: BoardsStagesFormComponent;
  let fixture: ComponentFixture<BoardsStagesFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BoardsStagesFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardsStagesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
