import {
  Component,
  OnInit,
  Input,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Epic } from '@aitheon/project-manager';

@Component({
  selector: 'ai-epic-card',
  templateUrl: './epic-card.component.html',
  styleUrls: ['./epic-card.component.scss']
})
export class EpicCardComponent implements OnInit {
  @Input() epic: any;
  @Input() activeEpic: string;
  @Output() selectedEpic = new EventEmitter;
  @Output() epicForModal = new EventEmitter<Epic>();
  @Output() changedEpic = new EventEmitter<any>();
  showMore = false;
  percentage = 0;
  totalTasks: number;
  backgroundProgress: string;
  now: any;
  endTask: any;
  alertDate = false;

  @HostListener('document:click', ['$event'])
  click() {
    this.epic.moreBtnOpen = false;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.getPercentage(this.epic);
    this.now = new Date().getTime();
    this.endTask = new Date(this.epic.endDate).getTime();

    if (this.epic.endDate) {
      const timeDiff = Math.abs(this.endTask - this.now);
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (diffDays <= 1 && diffDays > 0 ) {
        this.alertDate = true;
      }
    }
  }

  getPercentage(epic: any) {
    if (epic.tasks && (epic.tasks.doneTasks > 0 || epic.tasks.unDoneTasks > 0)) {
      const counter = epic.tasks.doneTasks + epic.tasks.unDoneTasks;
      const res = (epic.tasks.doneTasks / counter) * 100;
      this.totalTasks = counter;
      this.percentage = Math.round(res);

      if (this.percentage < 25) {
        this.backgroundProgress = '#E96058';
      } else if (this.percentage >= 25 && this.percentage < 50) {
        this.backgroundProgress = '#ED9438';
      } else if (this.percentage >= 50 && this.percentage < 75) {
        this.backgroundProgress = '#F5BA06';
      } else if (this.percentage >= 75 && this.percentage < 100) {
        this.backgroundProgress = '#B1C82F';
      } else if (this.percentage === 100) {
        this.backgroundProgress = '#67B231';
      }
    } else  {
      this.totalTasks = 0;
      this.percentage = 0;
    }
  }

  openMore(epic: any, e: Event) {
    this.stopEvent(e);
    this.activeEpic = epic._id;
    this.selectedEpic.emit(epic);
  }

  openEpicForm(epic: Epic,  event: Event) {
    this.stopEvent(event);
    this.click();
    this.epicForModal.emit(epic);
  }

  changeEpicStatus(epic: Epic, status: string, event: Event) {
    this.stopEvent(event);
    this.click();
    this.changedEpic.emit({ epic, status });
  }

  goToEpic(event: Event) {
    this.stopEvent(event);
    event.preventDefault();

    const { _id } = this.epic;
    if (_id) {
      this.router.navigate(['../', 'epics', _id], { relativeTo: this.route});
    }
  }

  stopEvent(event: Event) {
    event.stopPropagation();
    event.preventDefault();
  }
}
