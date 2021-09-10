import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Stage } from '@aitheon/project-manager';
import { State } from '../../shared/constants/enums';

@Component({
  selector: 'ai-boards-stages-form',
  templateUrl: './boards-stages-form.component.html',
  styleUrls: ['./boards-stages-form.component.scss']
})
export class BoardsStagesFormComponent implements OnInit {

  @Input() stage: Stage;
  @Output('onSaved') onSaved: EventEmitter<Stage> = new EventEmitter<Stage>();
  @Output('onClose') onClose: EventEmitter<any> = new EventEmitter<any>();

  boardStageForm: FormGroup;
  systemColors = [
    '#e96058',
    '#ed9438',
    '#f5ba06',
    '#b1c82f',
    '#67b231',
    '#1ac0c9',
    '#589be9',
    '#6278c4',
    '#8c58e9',
    '#ca58e9',
    '#f39aba'
  ];

  color: any;

  states = [
    { _id: State.BACKLOG, name: 'Backlog' },
    { _id: State.TO_DO, name: 'To do' },
    { _id: State.IN_PROGRESS, name: 'In progress' },
    // { _id: State.DONE, name: 'Done' },
  ];
  submitted = false;

  constructor(
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.buildStageForm();
    this.color = this.stage.color;
  }

  buildStageForm() {
    this.boardStageForm = this.fb.group({
      name: [this.stage.name || '', Validators.required],
      color: [this.stage.color || '#7e7e7e'],
      state: [this.stage.state || '', Validators.required]
    });

    this.boardStageForm.valueChanges.subscribe(res => {
      this.color = res.color;
    })

    if (this.stage.state === State.DONE) {
      this.states.push({ _id: State.DONE, name: 'Done' });
      this.boardStageForm.get('state').disable();
    }
  }

  close() {
    this.onClose.emit();
  }

  saveStage() {
    this.boardStageForm.get('color').setValue(this.color);
    this.verifyStageNameValue();
    this.submitted = true;
    if (!this.boardStageForm.valid) {
      return;
    }
    const formValue = this.boardStageForm.value;
    const stage = { ...this.stage, ...formValue };
    this.onSaved.emit(stage);
    this.close();
  }

  verifyStageNameValue() {
    this.boardStageForm.get('name').patchValue(this.boardStageForm.get('name').value.trim());
  }

}
