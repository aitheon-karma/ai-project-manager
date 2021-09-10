import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'ai-task-due-date',
  templateUrl: './task-due-date.component.html',
  styleUrls: ['./task-due-date.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: TaskDueDateComponent,
    multi: true
  }]
})
export class TaskDueDateComponent implements OnInit {

  @Input() finishDate: Date;
  @Input() taskReadonly: boolean;
  private onChange;
  timeZone = 'AM';
  minDueDate = new Date();
  finishTime: any;
  resultFinishDate: Date;
  minutes: number = 0;
  hours: number = 0;
  showDueDateError = false;

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.finishDate) {
      this.resultFinishDate = new Date(this.finishDate);
      let hours = this.resultFinishDate.getHours();
      this.hours = hours;
      let minutes = this.resultFinishDate.getMinutes();
      this.minutes = minutes;
      if (minutes < 10) {
        minutes = `0${minutes}` as any;
      }
      if (hours < 10) {
        hours = `0${hours}` as any;
      }
      this.finishTime = `${hours}:${minutes}`;
    }
  }

  onValueChange(date: Date) {
    if (date) {
      this.resultFinishDate = date;
      this.resultFinishDate.setHours(this.hours);
      this.resultFinishDate.setMinutes(this.minutes);
    }
    this.onChange(this.resultFinishDate);
  }

  writeValue(value) {

  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.cd.detectChanges();
  }

  registerOnTouched(fn: any): void {  }

  setDisabledState(isDisabled: boolean): void {  }

  changeTimeZone(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    let zone = moment(new Date(this.finishDate)).format("A");
    if (this.timeZone == 'AM') {
      this.timeZone = 'PM'
    } else {
      this.timeZone = 'AM'
    }
  }

  onValueChanges(value: any) {
    const values = value.split(':');
    const hours = Number(values[0]);
    const minutes = Number(values[1]);
    if (isNaN(hours) || isNaN(minutes)) {
      return;
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      this.showDueDateError = true;
      this.resetTime();
    } else {
      this.hours = hours;
      this.minutes = minutes;
    }
    this.onValueChange(this.resultFinishDate);
  }

  resetTime() {
    this.finishTime = null;
    this.hours = 0;
    this.minutes = 0;
  }
}
