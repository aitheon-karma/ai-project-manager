import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ProjectTask, ProjectsRestService } from '@aitheon/project-manager';
import { FormControl } from '@angular/forms';
import { distinctUntilChanged, debounceTime, filter, switchMap, map } from 'rxjs/operators';
import { AuthService } from '@aitheon/core-client';
import * as _ from 'lodash';

interface Member {
  _id: string;
  profile: { firstName: string, lastName: string, avatarUrl: string };
  email: string;
}

@Component({
  selector: 'ai-task-assignee-form',
  templateUrl: './task-assignee-form.component.html',
  styleUrls: ['./task-assignee-form.component.scss']
})
export class TaskAssigneeFormComponent implements OnInit {

  @Input() task: ProjectTask;
  @Input() projectId: string;
  @Input() taskReadonly: boolean;
  @ViewChild('searchElement') searchElement: ElementRef;
  @Output() assigneeAdded = new EventEmitter<Member>();
  @Output() assigneeRemoved = new EventEmitter<Member>();

  assignedMembers: Member[];
  searchResults: Member[] = [];
  searchFocused: boolean;
  showSearch = false;
  searchControl: FormControl;
  currentUser: Member;
  currentIsAssigned: boolean = false;

  constructor(
    private projectsService: ProjectsRestService,
    private authService: AuthService) { }

  ngOnInit() {
    this.searchControl = new FormControl();
    this.initializeSearch();
    this.assignedMembers = this.task.orchestratorTask.assigned;
    
    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });
    this.checkCurrentUser();
  }

  private initializeSearch() {
    this.searchControl.valueChanges
    .pipe(debounceTime(350),
      distinctUntilChanged(),
      filter(val => val.trim().length > 1),
      switchMap(text => this.projectsService.members(this.projectId, text.trim())))
    .subscribe((members: any[]) => {
      members = members.map((m: any) => m.user).filter((u: Member) =>  !this.assignedMembers.map(am => am._id).includes(u._id) );
      const duplicatesGroup = _.countBy(members, '_id');
      for (let [key, value] of Object.entries(duplicatesGroup)) {
        if (value === 1) { continue; }
        while (value !== 1) {
          const index = members.findIndex(m => m._id === key);
          members.splice(index, 1);
          value--;
        }
      }
      this.searchResults = members;
    });
  }

  showSearchAndFocus() {
    this.showSearch = true;
    setTimeout(() =>  this.searchElement.nativeElement.focus(), 0 );
  }

  hideSearch() {
    setTimeout(() => { this.showSearch = false; this.searchControl.setValue(''); }, 200);
  }

  firstLetters(member: Member) {
    return `${member.profile.firstName[0]}${member.profile.lastName[0]}`;
  }

  add(member: Member) {
    this.assigneeAdded.emit(member);
    this.searchControl.setValue('');
    this.searchResults = [];
    this.checkCurrentUser();
  }

  remove(member: Member) {
    this.assigneeRemoved.emit(member);
    this.assignedMembers = this.task.orchestratorTask.assigned;
    this.checkCurrentUser();
  }

  checkCurrentUser() {
    this.currentIsAssigned = this.assignedMembers.map(am => am._id).includes(this.currentUser._id);
  }
}
