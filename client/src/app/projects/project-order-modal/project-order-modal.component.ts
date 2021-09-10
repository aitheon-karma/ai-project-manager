import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProjectsOrderRestService } from '@aitheon/project-manager';

export interface DropResult {
  removedIndex: number | null;
  addedIndex: number | null;
  payload?: any;
  element?: HTMLElement;
}

@Component({
  selector: 'ai-project-order-modal',
  templateUrl: './project-order-modal.component.html',
  styleUrls: ['./project-order-modal.component.scss']
})
export class ProjectOrderModalComponent implements OnInit, AfterViewInit {

  @Output() close: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() orderedProjects: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() projects: any[];
  @Input() activeProject: any;

  avatarColors = ['#E96058', '#ED9438', '#F5BA06', '#67B231', '#1AC0C9', '#589BE9', '#6278C4', '#8C58E9', '#CA58E9', '#F39ABA'];
  sortedProjects: any[];
  finalArray: any;

  constructor(private projectsOrderService: ProjectsOrderRestService) { }

  ngOnInit(): void {
    this.sortedProjects = [...this.projects];
    this.getRandomColor();
  }

  ngAfterViewInit(): void {
    document.getElementById(this.activeProject).scrollIntoView({block: 'center'});
  }

  onTaskDrop(dropResult: DropResult) {
    const { addedIndex, removedIndex, payload } = dropResult;

    this.sortedProjects.splice(removedIndex, 1);
    this.sortedProjects.splice(addedIndex, 0, payload);
  }

  getTaskDragData() {
    return (index: number) => this.sortedProjects[index];
  }

  closeModal() {
    this.close.emit(true);
  }

  getRandomColor() {
    this.sortedProjects.map(project => {
      project['color'] = this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
    });
  }

  save() {
    this.finalArray = {projects: this.sortedProjects.map(project => project._id)};
    this.projectsOrderService.createOrder(this.finalArray).subscribe();
    this.orderedProjects.emit(true);
  }
}
