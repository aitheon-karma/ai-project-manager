import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ai-backlog',
  templateUrl: './backlog-dashboard.component.html',
  styleUrls: ['./backlog-dashboard.component.scss']
})
export class BacklogDashboardComponent implements OnInit {
  taskName: any;

  constructor() { }

  ngOnInit() {}
}
