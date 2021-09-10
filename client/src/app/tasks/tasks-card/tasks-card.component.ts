import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Stage, ProjectTask, Project } from '@aitheon/project-manager';

@Component({
  selector: 'ai-tasks-card',
  templateUrl: './tasks-card.component.html',
  styleUrls: ['./tasks-card.component.scss']
})
export class TasksCardComponent implements OnInit {

  @Input('task') projectTask: ProjectTask;
  @Input('stage') stage: Stage;
  @Input('project') project: Project;
  @Output() openModal = new EventEmitter();

  icon: string;
  bgcolor: string;
  task: any;
  priority: string;

  constructor( ) { }

  ngOnInit() {
    this.task = {
      ...this.projectTask?.orchestratorTask,
      ...this.projectTask,
    };
    this.getPriorityColor();
    this.getIconData();
  }

  getPriorityColor() {
    if (this.task.priority === 1) {
      this.priority = 'Low';
    } else if (this.task.priority === 2) {
      this.priority = 'Medium';
    } else if (this.task.priority === 3) {
      this.priority = 'High';
    } else if (this.task.priority === 4) {
      this.priority = 'Highest';
    }
  }

  getIconData() {
    if (this.task.subtype && this.task.subtype !== '' && this.task.subtype === 'ISSUE') {
      this.icon = 'icon--settings';
      this.bgcolor = '#e96058';
    } else if (this.task.type === 'ISSUE') {
      this.icon = 'icon--settings';
      this.bgcolor = '#e96058';
    } else if (this.task.type === 'TASK') {
      this.icon = 'icon--tick';
      this.bgcolor = '#7e7e7e';
    } else if (this.task.type === 'STORY') {
      this.icon = 'icon--bookmark';
      this.bgcolor = '#589be9';
    }
  }

  clickTask(event){
    event.preventDefault();
  }
}
