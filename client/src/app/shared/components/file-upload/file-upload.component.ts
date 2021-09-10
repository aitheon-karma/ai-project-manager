import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RestService, Document } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

const DRIVE_API = `${environment.baseApi}/drive/api`;
@Component({
  selector: 'ai-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FileUploadComponent,
    multi: true
  }]
})
export class FileUploadComponent implements OnInit, ControlValueAccessor {
  @ViewChild('driveUploader') driveUploader: any;
  @Input() userId: string;
  @Input() serviceId: string;
  @Input() organizationId: string;

  private onChange;
  loading = false;
  docs: Document[] = [];

  currentServiceKey: {
    _id: string,
    key: string
  };

  constructor(
    private toastr: ToastrService,
    private restService: RestService,
  ) { }

  ngOnInit() { }

  onBeforeUpload(event) {
    this.loading = true;
    this.currentServiceKey = {
      _id: this.serviceId,
      key:  this.userId
    };

    this.restService.post(`${DRIVE_API}/acl`, {
      level: 'FULL',
      user: this.userId,
      service: this.currentServiceKey,
      public: true
    }, true).subscribe((res) => {
      this.loading = false;
      this.driveUploader.uploadAll();
    }, (err: any) => {
      this.loading = false;
      this.toastr.error('Could not upload files');
      this.driveUploader.uploader.queue = [];
    });
  }

  onSuccessUpload(file: any) {
    this.docs.push(file);
    this.onChange(this.docs);
  }

  removeDocument(doc) {
    const index = this.docs.findIndex((item: Document) => item === doc);
    this.docs.splice(index , 1);
  }

  writeValue(value) {
    if (Array.isArray(value)) {
      this.docs = value;
    } else {
      this.docs = !!value ? [value] : [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {  }

  setDisabledState(isDisabled: boolean): void {  }
}
