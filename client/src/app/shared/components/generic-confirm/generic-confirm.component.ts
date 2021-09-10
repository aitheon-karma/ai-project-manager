import { Component, ViewChild, Input } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

export interface ModalData {
  text?: string;
  hideNoButton?: boolean;
  confirmText?: string;
  headlineText?: string;
  callback?: any;
  cancelText?: string;
}

@Component({
  selector: 'ai-generic-confirm',
  templateUrl: './generic-confirm.component.html',
  styleUrls: ['./generic-confirm.component.scss']
})
export class GenericConfirmComponent {

  @ViewChild('formModal') formModal: BsModalRef;
  @Input() showCancel = true;

  data: ModalData = {} as ModalData;
  modalRef: BsModalRef;

  constructor(
    private modalService: BsModalService
  ) {}

  hide() {
    this.modalRef.hide();
  }

  onConfirm() {
    this.hide();
    if (this.data.callback) {
      this.data.callback();
    }
  }

  show(data: ModalData) {
    this.data = data;
    this.modalRef = this.modalService.show(
      this.formModal
    );
  }

  cancel() {
    this.modalRef.hide();
  }
}