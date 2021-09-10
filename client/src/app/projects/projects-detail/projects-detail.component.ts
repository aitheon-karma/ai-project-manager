import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardsRestService, ProjectTasksRestService, Board, ProjectTask } from '@aitheon/project-manager';
import { switchMap , map } from 'rxjs/operators';
import { forkJoin, } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-projects-detail',
  templateUrl: './projects-detail.component.html',
  styleUrls: ['./projects-detail.component.scss']
})
export class ProjectsDetailComponent implements OnInit {

  board: Board;
  tasks: ProjectTask[];
  loading = true;

  constructor(private route: ActivatedRoute,
    private boardService: BoardsRestService,
    private toastr: ToastrService,
    private taskService: ProjectTasksRestService) { }

  ngOnInit() {

    const projectId = this.route.parent.snapshot.params.projectId;
    const tasks$ = this.route.params.pipe(switchMap(params => {
      return forkJoin([this.taskService.listByBoard(projectId, params.boardId),
        this.boardService.getById(params.boardId)]).pipe(map(results => ({tasks: results[0], board: results[1]})));
    }));

    tasks$.subscribe(results => {
      this.board = results.board;
      this.tasks = results.tasks;
      this.loading = false;
    }, err => {
      this.toastr.error(err.error.message || err.message);
    });

  }



}
