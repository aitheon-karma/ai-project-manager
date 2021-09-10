import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'ai-dynamic-confirm',
  templateUrl: './dynamic-confirm.component.html',
  styleUrls: ['./dynamic-confirm.component.scss']
})
export class DynamicConfirmComponent implements OnInit {
  @Output() cancel: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() delete: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  stopEvents(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  onCancelDelete(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.cancel.emit(true);
  }

  onDeleteAttachment(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.delete.emit(true);
  }
}
