import { Component, OnInit, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { EpicsRestService, Epic } from '@aitheon/project-manager';

@Component({
  selector: 'ai-epic-form',
  templateUrl: './epic-form.component.html',
  styleUrls: ['./epic-form.component.scss']
})

export class EpicFormComponent implements OnInit {
  @Input() isSubmitted: boolean;
  @Input() epic: Epic;
  @Output() closeModal = new EventEmitter<boolean>();
  @Output() formDirty = new EventEmitter<boolean>();
  @Output() createdEpic = new EventEmitter<Epic>();
  @Output() disableButton = new EventEmitter<boolean>();
  @ViewChild('name') name: ElementRef;
  epicForm: FormGroup;
  currentOrg: any;
  CurrentUser: any;
  emptyEpic = new Epic;
  isEpicLoading: boolean;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private toastrService: ToastrService,
              private epicsRestService: EpicsRestService) { }

  ngOnInit() {
    this.authService.activeOrganization.subscribe(org => {
      this.currentOrg = org;
    });
    this.authService.currentUser.subscribe(user => {
      this.CurrentUser = user;
    });
    if (this.epic) {
      this.buildForm(this.epic);
    } else {
      this.buildForm(this.emptyEpic);
    }

    this.epicForm.valueChanges.subscribe(() => this.formDirty.emit(this.epicForm.dirty && this.epicForm.get('name').value.length));
  }

  private buildForm(epic?: any) {
    this.epicForm = this.fb.group({
      name: [epic.name ? epic.name : '', [Validators.required, Validators.maxLength(40)]],
      description: [epic.description ? epic.description : '', Validators.maxLength(200)],
      startDate: [epic.startDate ? new Date(epic.startDate) : ''],
      endDate: [epic.endDate ? new Date(epic.endDate) : '']
    });

    if (!this.epic) {
      const timeout = setTimeout(() => {
        this.name.nativeElement.focus();
        clearTimeout(timeout);
      });
    }

    this.epicForm.get('name').valueChanges.subscribe(res => {
      if (res === ' ') {
        this.trimValue();
      }
    });
  }

  onSubmit(e?: Epic) {
    const toastrFieldsErrorMessage = 'Please fill all required fields';
    let toastrSuccessMessage = ``;
    this.isSubmitted = true;

    if (!this.epicForm.valid) {
      this.toastrService.error(toastrFieldsErrorMessage);
      return;
    } else {
      this.isEpicLoading = true;
      const epic = {
        organization: this.currentOrg,
        name: this.epicForm.get('name').value,
        description: this.epicForm.get('description').value,
        startDate: this.epicForm.get('startDate').value,
        endDate: this.epicForm.get('endDate').value,
      };
      if (!e) {
        this.epicsRestService.create(epic).subscribe((res) => {
          toastrSuccessMessage = `Epic \"${res.name}\" successfully created`;

          this.isEpicLoading = false;
          this.createdEpic.emit(res);
          this.toastrService.success(toastrSuccessMessage);
        });
      } else if (e) {
        this.epicsRestService.update(e._id, epic).subscribe((res) => {
          toastrSuccessMessage = `Epic \"${res.name}\" successfully updated`;

          this.isEpicLoading = false;
          this.createdEpic.emit(res);
          this.toastrService.success(toastrSuccessMessage);
        });
      }
    }
  }

  trimValue() {
    this.epicForm.get('name').patchValue(this.epicForm.get('name').value.trim());
  }
}
