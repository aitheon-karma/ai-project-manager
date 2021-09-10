import { Component, OnInit, Input, Output, EventEmitter, } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Label, LabelsRestService } from '@aitheon/project-manager';
import { ToastrService } from 'ngx-toastr';
import { TaskModalService } from 'src/app/tasks/shared/task-modal.service';

@Component({
  selector: 'ai-label-form',
  templateUrl: './label-form.component.html',
  styleUrls: ['./label-form.component.scss']
})
export class LabelFormComponent implements OnInit {
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private labelsRestService: LabelsRestService,
    public taskModalService: TaskModalService,

  ) { }

  errorInLabelName = false;
  errorInLabelColor = false;
  labelForm: FormGroup;
  isNew: boolean;
  @Input() projectLabelList: Array<Label>;
  @Input() labelToEdit: Label;
  @Input() projectId: string;
  @Input() labelFormModalRef: BsModalRef;
  @Output() create = new EventEmitter<any>();
  @Output() update = new EventEmitter<any>();


  ngOnInit() {
    this.isNew = !this.labelToEdit;
    this.buildLabelForm();
  }
  buildLabelForm() {
    this.labelForm = this.fb.group({
      name: ['', [Validators.required]],
      color: ['bg-fire', [Validators.required]],
    });
    if (!this.isNew) { this.patchValues(); }
  }
  patchValues() {
    this.labelForm.get('name').setValue(this.labelToEdit.name);
    this.labelForm.get('color').setValue(this.labelToEdit.color);
  }
  updateLabel() {
    if (this.labelForm.valid) {
      if (!this.isAlreadyExist(this.labelForm.value.name)) {
        const labelData: Label = {
          _id: this.labelToEdit._id,
          name: this.labelForm.value.name,
          color: this.labelForm.value.color,
          project: this.projectId
        };
        this.isLoading = true;
        this.labelsRestService.update(labelData._id, labelData).subscribe(res => {
          this.isLoading = false;
          this.resetFormAndClose();
          this.toastr.success('New label successfully added');
          this.update.emit(labelData);
        }, error => {
          this.isLoading = false;
          this.toastr.error('Error while updating label.');
        });
      } else {
        this.toastr.error('This label is already exist.');
      }
    }
  }
  isAlreadyExist(labelName: string): boolean {
    if (!this.isNew) {
      const templabels = this.projectLabelList.filter((label) => {
        if (label.name !== labelName) {
          return label;
        }
      });
      return !!_.find(templabels, (label) => label.name.trim().toLowerCase() === labelName.trim().toLowerCase());
    } else {
      return !!_.find(this.projectLabelList, (label) => label.name.trim().toLowerCase() === labelName.trim().toLowerCase());
    }
  }
  selectColor(labelColor: string) {
    this.labelForm.get('color').setValue(labelColor);
  }

  createLabel() {
    if (this.labelForm.valid) {
      if (!this.isAlreadyExist(this.labelForm.value.name)) {
        const label = {
          name: this.labelForm.value.name,
          color: this.labelForm.value.color,
          project: this.projectId
        };
        this.isLoading = true;
        this.labelsRestService.create(label).subscribe((response) => {
        sessionStorage.setItem('newLabel', JSON.stringify(response));
        this.isLoading = false;
        this.resetFormAndClose();
        this.create.emit(response);
        this.toastr.success('New label successfully added');
        this.taskModalService.taskFormViewStatus$.next(true);
      }, error => {
        this.toastr.error('Error while creating label!');
        this.isLoading = false;
        });

      } else {
        this.toastr.error('This label is already exist.');
      }
    }
  }

  resetFormAndClose() {
    this.labelFormModalRef.hide();
    this.labelForm.reset();
    this.taskModalService.taskFormViewStatus$.next(true);
    this.labelToEdit = undefined;
  }

  cancelLabelCreation() {
    this.resetFormAndClose();
  }
}
